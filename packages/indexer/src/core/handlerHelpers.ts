/**
 * Shared handler helpers for EntityHandler handle() methods.
 *
 * Provides the standard entity resolution pattern for handlers that need to
 * check if entities already exist before creating or updating them.
 *
 * Core pattern:
 * 1. resolveEntity/resolveEntities checks batch → DB → null
 * 2. Spread existing entity to preserve all fields including FKs
 * 3. Override only the fields this handler owns
 * 4. Add to BatchContext for pipeline persistence
 *
 * This replaces the old ad-hoc patterns with a single recognizable shape:
 * `const existing = await resolveEntity(...); new Entity({ ...existing, id, newField })`
 */
import { type EntityRegistry, getEntityConstructor } from '@/core/entityRegistry';
import { IBatchContext } from '@/core/types';
import { Store } from '@subsquid/typeorm-store';
import { FindOptionsWhere, In } from 'typeorm';

// ---------------------------------------------------------------------------
// Entity resolution utilities
// ---------------------------------------------------------------------------

/**
 * Resolve a single entity from batch or database.
 *
 * The standard lookup order:
 *   1. Check BatchContext (current batch, in-memory)
 *   2. Check database (previous batches, persisted)
 *   3. Return null if not found
 *
 * This is THE way to look up existing entities in handlers.
 * Every handler that updates an entity that might already exist
 * MUST use this function (or resolveEntities for bulk).
 *
 * @param store        - Subsquid store for DB queries
 * @param batchCtx     - BatchContext for intra-batch entities
 * @param entityType   - Entity type key in BatchContext (e.g., 'NFT')
 * @param id           - Entity ID to resolve
 * @returns Entity if found in batch or DB, null otherwise
 */
export async function resolveEntity<K extends keyof EntityRegistry & string>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: K,
  id: string,
): Promise<EntityRegistry[K] | null> {
  // 1. Check batch first (current batch)
  const batchEntity = batchCtx.getEntities(entityType).get(id);
  if (batchEntity) return batchEntity;

  // 2. Check database (previous batches)
  const ctor = getEntityConstructor(entityType);
  const dbEntity = await store.findOneBy(ctor, { id } as FindOptionsWhere<EntityRegistry[K]>);
  return dbEntity ?? null;
}

/**
 * Resolve multiple entities from batch and database.
 *
 * Efficient bulk variant: single DB query for all IDs not found in batch.
 * Returns a merged Map with batch entities taking priority over DB entities.
 *
 * **IMPORTANT:** Returns ALL batch entities (not just requested IDs) plus any
 * requested IDs from DB. This supports intra-batch updates where one event's
 * entity affects another (e.g., totalSupply handler updates multiple addresses).
 *
 * Usage:
 * ```typescript
 * const nfts = await resolveEntities(
 *   hctx.store,
 *   hctx.batchCtx,
 *   'NFT',
 *   potentialIds
 * );
 * ```
 *
 * @param store        - Subsquid store for DB queries
 * @param batchCtx     - BatchContext for intra-batch entities
 * @param entityType   - Entity type key in BatchContext (e.g., 'NFT')
 * @param ids          - IDs to query from database
 * @returns Map containing ALL batch entities + DB entities for requested IDs
 */
export async function resolveEntities<K extends keyof EntityRegistry & string>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: K,
  ids: string[],
): Promise<Map<string, EntityRegistry[K]>> {
  // 1. Start with ALL batch entities (preserves intra-batch updates to other entities)
  const batchEntities = batchCtx.getEntities(entityType);
  const merged = new Map<string, EntityRegistry[K]>(batchEntities);

  // 2. Query DB for requested IDs not already in batch
  const idsNotInBatch = ids.filter((id) => !batchEntities.has(id));
  if (idsNotInBatch.length > 0) {
    const ctor = getEntityConstructor(entityType);
    const dbEntities = await store.findBy(ctor, {
      id: In(idsNotInBatch),
    } as FindOptionsWhere<EntityRegistry[K]>);
    for (const entity of dbEntities) {
      merged.set(entity.id, entity);
    }
  }

  return merged;
}
