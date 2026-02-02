import { FetchRequest } from './metadata';
import { EnrichmentRequest, EntityCategory, VerificationResult } from './verification';

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
}
