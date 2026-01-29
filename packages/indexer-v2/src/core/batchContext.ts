import { EntityCategory, FetchRequest, IBatchContext, VerificationResult } from './types';

/**
 * BatchContext is the shared entity bag for a single batch.
 *
 * It replaces the 60+ destructured Maps/arrays/Sets that were manually
 * threaded through scanner → entityPopulation → index.ts in v1.
 *
 * Plugins write entities and track addresses during the extract phase.
 * The pipeline sets verification results after the verify phase.
 * Plugins read verification results during the populate phase.
 * Plugins read their entities during the persist phase.
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
   * Address sets per EntityCategory, used for batch verification.
   * Plugins call trackAddress() during extract to register addresses
   * that need supportsInterface() checks.
   */
  private readonly addressSets = new Map<EntityCategory, Set<string>>();

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

  // -------------------------------------------------------------------------
  // Entity storage
  // -------------------------------------------------------------------------

  addEntity(type: string, id: string, entity: unknown): void {
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

  // -------------------------------------------------------------------------
  // Address tracking
  // -------------------------------------------------------------------------

  trackAddress(category: EntityCategory, address: string): void {
    let set = this.addressSets.get(category);
    if (!set) {
      set = new Set();
      this.addressSets.set(category, set);
    }
    set.add(address);
  }

  getAddresses(category: EntityCategory): Set<string> {
    return this.addressSets.get(category) ?? new Set();
  }

  getTrackedCategories(): EntityCategory[] {
    return [...this.addressSets.keys()].filter(
      (category) => this.addressSets.get(category)!.size > 0,
    );
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
      return { new: new Set(), valid: new Set(), invalid: new Set() };
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

  getFetchQueue(): FetchRequest[] {
    return this.fetchQueue;
  }
}
