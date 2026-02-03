import {
  ClearRequest,
  EnrichmentRequest,
  Entity,
  EntityCategory,
  FetchRequest,
  IBatchContext,
  PersistHint,
  VerificationResult,
} from './types';

/**
 * BatchContext is the shared entity bag for a single batch.
 *
 * It replaces the 60+ destructured Maps/arrays/Sets that were manually
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
export class BatchContext implements IBatchContext {
  /**
   * Entity storage: entityType → (entityId → entity)
   *
   * Using Map<string, Map<string, unknown>> internally.
   * Type safety is enforced on the read side via getEntities<T>().
   */
  private readonly entities = new Map<string, Map<string, unknown>>();

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
   * Stored as Entity-constrained requests for type safety. Handlers provide
   * fully-typed requests via queueEnrichment<T>(), which validates field names
   * at compile time before storing here.
   */
  private readonly enrichmentQueue: EnrichmentRequest<Entity>[] = [];

  /**
   * Persist hints per entity type, used by the pipeline to determine
   * which entity types need merge-upsert behavior in Step 4.
   *
   * Stored as Entity-constrained hints for type safety. Handlers provide
   * fully-typed hints via setPersistHint<T>(), which validates field names
   * at compile time before storing here.
   */
  private readonly persistHints = new Map<string, PersistHint<Entity>>();

  /**
   * Queue of clear requests for sub-entity deletion, consumed by
   * the pipeline in Step 3.5 before persisting derived entities.
   *
   * Stored as Entity-constrained requests for type safety. Handlers provide
   * fully-typed requests via queueClear<T>(), which validates field names
   * at compile time before storing here.
   */
  private readonly clearQueue: ClearRequest<Entity>[] = [];

  // -------------------------------------------------------------------------
  // Entity storage
  // -------------------------------------------------------------------------

  addEntity(type: string, id: string, entity: unknown): void {
    // Prevent handlers from adding to raw entity type keys after Step 2
    if (this.sealedRawTypes !== null && this.sealedRawTypes.has(type)) {
      throw new Error(
        `Handler attempted to add entity to raw type '${type}' which was already ` +
          `persisted in Step 2. Handlers must use a different entity type key for ` +
          `derived entities. This prevents silent data loss since Step 4 skips raw types.`,
      );
    }

    let map = this.entities.get(type);
    if (!map) {
      map = new Map();
      this.entities.set(type, map);
    }
    map.set(id, entity);
  }

  getEntities<T>(type: string): Map<string, T> {
    const map = this.entities.get(type);
    if (!map) return new Map<string, T>();
    return map as Map<string, T>;
  }

  removeEntity(type: string, id: string): void {
    this.entities.get(type)?.delete(id);
  }

  hasEntities(type: string): boolean {
    const map = this.entities.get(type);
    return map !== undefined && map.size > 0;
  }

  getEntityTypeKeys(): string[] {
    return [...this.entities.keys()];
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
    // Upcast to Entity-constrained request for storage.
    // Type safety is enforced at the handler call site via the generic parameter.
    this.enrichmentQueue.push(request as unknown as EnrichmentRequest<Entity>);
  }

  getEnrichmentQueue(): ReadonlyArray<EnrichmentRequest<Entity>> {
    return this.enrichmentQueue;
  }

  // -------------------------------------------------------------------------
  // Persist hints
  // -------------------------------------------------------------------------

  setPersistHint<T extends Entity>(type: string, hint: PersistHint<T>): void {
    // Upcast to Entity-constrained hint for storage.
    // Type safety is enforced at the handler call site via the generic parameter.
    this.persistHints.set(type, hint as unknown as PersistHint<Entity>);
  }

  getPersistHint(type: string): PersistHint<Entity> | undefined {
    return this.persistHints.get(type);
  }

  // -------------------------------------------------------------------------
  // Clear queue
  // -------------------------------------------------------------------------

  queueClear<T extends Entity>(request: ClearRequest<T>): void {
    // Upcast to Entity-constrained request for storage.
    // Type safety is enforced at the handler call site via the generic parameter.
    this.clearQueue.push(request as unknown as ClearRequest<Entity>);
  }

  getClearQueue(): ReadonlyArray<ClearRequest<Entity>> {
    return this.clearQueue;
  }
}
