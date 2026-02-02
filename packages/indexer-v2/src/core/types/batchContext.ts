import { FetchRequest } from './metadata';
import { EnrichmentRequest, EntityCategory, VerificationResult } from './verification';

/**
 * Persist hint for derived entities requiring merge-upsert behavior.
 *
 * When set for an entity type, the pipeline reads existing DB records
 * and preserves non-null values in the specified mergeFields before
 * upserting. This prevents data loss when multiple data key sources
 * populate different fields of the same entity across batches.
 */
export interface PersistHint {
  /** Entity class constructor for TypeORM operations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entityClass: new (...args: any[]) => any;
  /** Field names to preserve across batches (keep existing non-null values) */
  mergeFields: string[];
}

/**
 * Clear request for sub-entity deletion before re-insertion.
 *
 * Handlers queue clear requests for sub-entities that need delete-then-reinsert
 * behavior (e.g., LSP6 permissions, allowed calls). The pipeline processes
 * these in Step 3.5 before persisting derived entities.
 */
export interface ClearRequest {
  /** Sub-entity class constructor for TypeORM findBy/remove operations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subEntityClass: new (...args: any[]) => any;
  /** FK field name on sub-entity that references the parent (e.g., 'controller') */
  fkField: string;
  /** Parent entity IDs whose sub-entities should be cleared */
  parentIds: string[];
}

/**
 * BatchContext interface — shared entity bag for a single batch.
 *
 * This replaces the 60+ destructured Maps/arrays/Sets that were manually
 * threaded through scanner → entityPopulation → index.ts in v1.
 *
 * EventPlugins add entities and queue enrichment requests during Step 1 (EXTRACT).
 * The pipeline persists raw entities in Step 2 (PERSIST RAW).
 * EntityHandlers create derived entities in Step 3 (HANDLE).
 * The pipeline persists derived entities in Step 4 (PERSIST DERIVED).
 * The pipeline sets verification results after Step 5 (VERIFY).
 * The pipeline resolves FK references in Step 6 (ENRICH).
 *
 * A new BatchContext is created for each batch — no state carries over.
 */
export interface IBatchContext {
  // Entity storage
  addEntity(type: string, id: string, entity: unknown): void;
  getEntities<T>(type: string): Map<string, T>;
  hasEntities(type: string): boolean;
  getEntityTypeKeys(): string[];

  /**
   * Seal the set of raw entity type keys after Step 2 persistence.
   * After sealing, any attempt to add entities to a sealed type throws an error.
   *
   * This prevents handlers (Step 3) from accidentally adding entities to raw
   * entity type keys that were already persisted in Step 2 via insert().
   * Entities added to sealed types would be silently lost since Step 4 skips
   * raw types.
   */
  sealRawEntityTypes(): void;

  // Verification results (set by pipeline after verify phase)
  setVerified(category: EntityCategory, result: VerificationResult): void;
  getVerified(category: EntityCategory): VerificationResult;
  isValid(category: EntityCategory, address: string): boolean;

  // Metadata fetch queue (consumed by worker pool)
  queueFetch(request: FetchRequest): void;
  getFetchQueue(): ReadonlyArray<FetchRequest>;

  // Enrichment queue (for deferred FK resolution)
  queueEnrichment(request: EnrichmentRequest): void;
  getEnrichmentQueue(): ReadonlyArray<EnrichmentRequest>;

  // Persist hints (for merge-upsert behavior)
  setPersistHint(type: string, hint: PersistHint): void;
  getPersistHint(type: string): PersistHint | undefined;

  // Clear queue (for sub-entity deletion)
  queueClear(request: ClearRequest): void;
  getClearQueue(): ReadonlyArray<ClearRequest>;
}
