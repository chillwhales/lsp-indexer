import { ENTITY_CONSTRUCTORS, type EntityRegistry } from './entityRegistry';
import {
  ClearRequest,
  DeleteRequest,
  EnrichmentRequest,
  Entity,
  EntityCategory,
  FetchRequest,
  IBatchContext,
  PersistHint,
  StoredClearRequest,
  StoredDeleteRequest,
  StoredEnrichmentRequest,
  StoredPersistHint,
  VerificationResult,
} from './types';

/**
 * BatchContext is the shared entity bag for a single batch.
 *
 * It consolidates entity storage and enrichment tracking into a single
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
export class BatchContext implements IBatchContext {
  /**
   * Entity storage: entityType → (entityId → entity)
   *
   * Stores entities as `Entity` (the base type with id + block ordering fields).
   * Type safety is provided by the generic `addEntity<K>` / `getEntities<K>`
   * methods which use `keyof EntityRegistry` to enforce bag key validity at
   * compile time and `instanceof ENTITY_CONSTRUCTORS[K]` at runtime.
   * `getEntityTypeKeys()` returns `(keyof EntityRegistry)[]` so callers
   * can iterate and call `getEntities(key)` directly without casts.
   */
  private readonly entities = new Map<string, Map<string, Entity>>();

  /**
   * Set of raw entity type keys sealed after Step 2 persistence.
   * After sealing, any attempt to add entities to a sealed type throws an error.
   */
  private sealedRawTypes: Set<string> | null = null;

  /**
   * Verification results per EntityCategory, populated by the pipeline
   * after the verify phase completes.
   */
  private readonly verificationResults = new Map<EntityCategory, VerificationResult>();

  /**
   * Queue of metadata fetch requests, consumed by the worker pool
   * during the handle phase.
   */
  private readonly fetchQueue: FetchRequest[] = [];

  /**
   * Queue of enrichment requests, consumed by the pipeline during
   * the enrichment phase to populate FK references after verification.
   *
   * Uses StoredEnrichmentRequest to allow heterogeneous storage of different
   * entity types. Type safety is enforced at the handler call site via
   * queueEnrichment<T>(), which validates fkField at compile time.
   */
  private readonly enrichmentQueue: StoredEnrichmentRequest[] = [];

  /**
   * Persist hints per entity type, used by the pipeline to determine
   * which entity types need merge-upsert behavior in Step 4.
   *
   * Uses StoredPersistHint to allow heterogeneous storage of different
   * entity types. Type safety is enforced at the handler call site via
   * setPersistHint<T>(), which validates mergeFields at compile time.
   */
  private readonly persistHints = new Map<string, StoredPersistHint>();

  /**
   * Queue of clear requests for sub-entity deletion, consumed by
   * the pipeline in Step 3.5 before persisting derived entities.
   *
   * Uses StoredClearRequest to allow heterogeneous storage of different
   * entity types. Type safety is enforced at the handler call site via
   * queueClear<T>(), which validates fkField at compile time.
   */
  private readonly clearQueue: StoredClearRequest[] = [];

  /**
   * Queue of delete requests for DB-level entity removal, consumed by
   * the pipeline in Step 4a before persisting derived entities.
   *
   * Uses StoredDeleteRequest to allow heterogeneous storage of different
   * entity types. Type safety is enforced at the handler call site via
   * queueDelete<T>(), which validates entity type at compile time.
   */
  private readonly deleteQueue: StoredDeleteRequest[] = [];

  // -------------------------------------------------------------------------
  // Entity storage
  // -------------------------------------------------------------------------

  /**
   * Add a typed entity to the bag. Validates at runtime via `instanceof`
   * that the entity matches the expected constructor for the bag key.
   *
   * @throws Error if the entity is not an instance of the expected constructor
   * @throws Error if the bag key is sealed (raw entity type already persisted in Step 2)
   */
  addEntity<K extends keyof EntityRegistry>(type: K, id: string, entity: EntityRegistry[K]): void {
    // Prevent handlers from adding to raw entity type keys after Step 2
    if (this.sealedRawTypes !== null && this.sealedRawTypes.has(type)) {
      throw new Error(
        `Handler attempted to add entity to raw type '${type}' which was already ` +
          `persisted in Step 2. Handlers must use a different entity type key for ` +
          `derived entities. This prevents silent data loss since Step 4 skips raw types.`,
      );
    }

    // Runtime validation: instanceof check against ENTITY_CONSTRUCTORS[type]
    const ctor = ENTITY_CONSTRUCTORS[type];
    if (!(entity instanceof ctor)) {
      throw new Error(
        `addEntity('${type}'): expected ${ctor.name}, got ${(entity as Entity)?.constructor?.name ?? 'unknown'}`,
      );
    }

    let map = this.entities.get(type);
    if (!map) {
      map = new Map();
      this.entities.set(type, map);
    }
    map.set(id, entity);
  }

  /**
   * Get typed entities from the bag. Spot-checks the first entity via
   * `instanceof` on non-empty maps to catch runtime type corruption.
   *
   * @returns Typed map of entity ID → entity, or empty map if no entities exist
   */
  getEntities<K extends keyof EntityRegistry>(type: K): Map<string, EntityRegistry[K]> {
    const raw = this.entities.get(type);
    if (!raw || raw.size === 0) return new Map() as Map<string, EntityRegistry[K]>;

    // Runtime validation: spot-check first entity
    const ctor = ENTITY_CONSTRUCTORS[type];
    const first = raw.values().next().value;
    if (!(first instanceof ctor)) {
      throw new Error(
        `getEntities('${type}'): expected ${ctor.name}, got ${(first as Entity)?.constructor?.name ?? 'unknown'}`,
      );
    }

    return raw as Map<string, EntityRegistry[K]>;
  }

  /**
   * Remove a typed entity from the bag.
   */
  removeEntity<K extends keyof EntityRegistry>(type: K, id: string): void {
    this.entities.get(type)?.delete(id);
  }

  /**
   * Check if typed entities exist in the bag for a given key.
   */
  hasEntities(type: keyof EntityRegistry): boolean {
    const map = this.entities.get(type);
    return map !== undefined && map.size > 0;
  }

  getEntityTypeKeys(): (keyof EntityRegistry)[] {
    return [...this.entities.keys()] as (keyof EntityRegistry)[];
  }

  sealRawEntityTypes(): void {
    this.sealedRawTypes = new Set(this.entities.keys());
  }

  // -------------------------------------------------------------------------
  // Verification results
  // -------------------------------------------------------------------------

  setVerified(category: EntityCategory, result: VerificationResult): void {
    this.verificationResults.set(category, result);
  }

  getVerified(category: EntityCategory): VerificationResult {
    const result = this.verificationResults.get(category);
    if (!result) {
      return { new: new Set(), valid: new Set(), invalid: new Set(), newEntities: new Map() };
    }
    return result;
  }

  isValid(category: EntityCategory, address: string): boolean {
    return this.getVerified(category).valid.has(address);
  }

  // -------------------------------------------------------------------------
  // Metadata fetch queue
  // -------------------------------------------------------------------------

  queueFetch(request: FetchRequest): void {
    this.fetchQueue.push(request);
  }

  getFetchQueue(): ReadonlyArray<FetchRequest> {
    return this.fetchQueue;
  }

  // -------------------------------------------------------------------------
  // Enrichment queue
  // -------------------------------------------------------------------------

  queueEnrichment<T extends Entity>(request: EnrichmentRequest<T>): void {
    // The request is structurally compatible with StoredEnrichmentRequest
    // Type safety is enforced at the handler call site via the generic parameter
    this.enrichmentQueue.push(request);
  }

  getEnrichmentQueue(): ReadonlyArray<StoredEnrichmentRequest> {
    return this.enrichmentQueue;
  }

  // -------------------------------------------------------------------------
  // Persist hints
  // -------------------------------------------------------------------------

  setPersistHint<T extends Entity>(type: string, hint: PersistHint<T>): void {
    // The hint is structurally compatible with StoredPersistHint
    // Type safety is enforced at the handler call site via the generic parameter
    this.persistHints.set(type, hint);
  }

  getPersistHint(type: string): StoredPersistHint | undefined {
    return this.persistHints.get(type);
  }

  // -------------------------------------------------------------------------
  // Clear queue
  // -------------------------------------------------------------------------

  queueClear<T extends Entity>(request: ClearRequest<T>): void {
    // The request is structurally compatible with StoredClearRequest
    // Type safety is enforced at the handler call site via the generic parameter
    this.clearQueue.push(request);
  }

  getClearQueue(): ReadonlyArray<StoredClearRequest> {
    return this.clearQueue;
  }

  // -------------------------------------------------------------------------
  // Delete queue
  // -------------------------------------------------------------------------

  queueDelete<T extends Entity>(request: DeleteRequest<T>): void {
    // The request is structurally compatible with StoredDeleteRequest
    // Type safety is enforced at the handler call site via the generic parameter
    this.deleteQueue.push(request);
  }

  getDeleteQueue(): ReadonlyArray<StoredDeleteRequest> {
    return this.deleteQueue;
  }
}
