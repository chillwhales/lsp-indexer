import type { EntityRegistry } from '../entityRegistry';
import { Entity, EntityConstructor, FKFields, WritableFields } from './entity';
import { FetchRequest } from './metadata';
import {
  EnrichmentRequest,
  EntityCategory,
  StoredEnrichmentRequest,
  VerificationResult,
} from './verification';

/**
 * Delete request for DB-level entity removal.
 *
 * Handlers queue delete requests for entities that need to be removed from
 * the database (e.g., OwnedToken/OwnedAsset with zero balance). The pipeline
 * processes these in Step 4a before persisting derived entities.
 *
 * This is distinct from `removeEntity()` which only removes entities from
 * the in-memory BatchContext bag. `queueDelete()` queues entities for
 * actual DB-level deletion via `store.remove()`.
 *
 * Generic parameter T: The entity type being deleted.
 */
export interface DeleteRequest<T extends Entity> {
  /** Entity class constructor for TypeORM remove operations */
  entityClass: EntityConstructor<T>;
  /** Entity instances to delete from the database */
  entities: T[];
}

/**
 * Internal storage type for delete requests.
 *
 * Structurally compatible with DeleteRequest<T> for any T, allowing
 * heterogeneous storage. Type safety is enforced at the handler call site
 * via queueDelete<T>().
 */
export type StoredDeleteRequest = {
  entityClass: EntityConstructor<Entity>;
  entities: Entity[];
};

/**
 * Persist hint for derived entities requiring merge-upsert behavior.
 *
 * When set for an entity type, the pipeline reads existing DB records
 * and preserves non-null values in the specified mergeFields before
 * upserting. This prevents data loss when multiple data key sources
 * populate different fields of the same entity across batches.
 *
 * Generic parameter T: The entity type being persisted.
 * This enables compile-time validation that mergeFields are valid
 * writable field names on the entity.
 */
export interface PersistHint<T extends Entity> {
  /** Entity class constructor for TypeORM operations */
  entityClass: EntityConstructor<T>;
  /** Field names to preserve across batches (must be writable fields, not FKs) */
  mergeFields: readonly (WritableFields<T> & string)[];
}

/**
 * Internal storage type for persist hints.
 *
 * Structurally compatible with PersistHint<T> for any T, allowing heterogeneous
 * storage. The mergeFields constraint is widened to string[] since we can't know
 * at storage time which specific entity type's writable fields are valid.
 */
export type StoredPersistHint = Omit<PersistHint<Entity>, 'mergeFields'> & {
  mergeFields: readonly string[];
};

/**
 * Clear request for sub-entity deletion before re-insertion.
 *
 * Handlers queue clear requests for sub-entities that need delete-then-reinsert
 * behavior (e.g., LSP6 permissions, allowed calls). The pipeline processes
 * these in Step 3.5 before persisting derived entities.
 *
 * Generic parameter T: The sub-entity type being cleared.
 * This enables compile-time validation that fkField is actually a FK field
 * on the entity (not a primitive field).
 */
export interface ClearRequest<T extends Entity> {
  /** Sub-entity class constructor for TypeORM findBy/remove operations */
  subEntityClass: EntityConstructor<T>;
  /** FK field name on sub-entity that references the parent (must be a FK field) */
  fkField: FKFields<T> & string;
  /** Parent entity IDs whose sub-entities should be cleared */
  parentIds: string[];
}

/**
 * Internal storage type for clear requests.
 *
 * Structurally compatible with ClearRequest<T> for any T, allowing heterogeneous
 * storage. The fkField constraint is widened to string.
 */
export type StoredClearRequest = Omit<ClearRequest<Entity>, 'fkField'> & {
  fkField: string;
};

/**
 * BatchContext interface — shared entity bag for a single batch.
 *
 * Consolidates entity storage and enrichment tracking into a single
 * container threaded through all pipeline steps.
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
  // Typed entity storage — compile-time bag key validation
  addEntity<K extends keyof EntityRegistry>(type: K, id: string, entity: EntityRegistry[K]): void;
  getEntities<K extends keyof EntityRegistry>(type: K): Map<string, EntityRegistry[K]>;
  removeEntity<K extends keyof EntityRegistry>(type: K, id: string): void;
  hasEntities(type: keyof EntityRegistry): boolean;

  getEntityTypeKeys(): (keyof EntityRegistry)[];

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
  queueEnrichment<T extends Entity>(request: EnrichmentRequest<T>): void;
  getEnrichmentQueue(): ReadonlyArray<StoredEnrichmentRequest>;

  // Persist hints (for merge-upsert behavior)
  setPersistHint<T extends Entity>(type: string, hint: PersistHint<T>): void;
  getPersistHint(type: string): StoredPersistHint | undefined;

  // Clear queue (for sub-entity deletion)
  queueClear<T extends Entity>(request: ClearRequest<T>): void;
  /** Queue a clear request with pre-erased types (for heterogeneous descriptor arrays). */
  queueClearStored(request: StoredClearRequest): void;
  getClearQueue(): ReadonlyArray<StoredClearRequest>;

  // Delete queue (for DB-level entity removal)
  queueDelete<T extends Entity>(request: DeleteRequest<T>): void;
  getDeleteQueue(): ReadonlyArray<StoredDeleteRequest>;
}
