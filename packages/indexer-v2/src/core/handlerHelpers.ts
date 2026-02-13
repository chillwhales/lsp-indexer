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
import { Entity, EntityConstructor, IBatchContext } from '@/core/types';
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
 * @param entityClass  - TypeORM entity class for DB queries
 * @param id           - Entity ID to resolve
 * @returns Entity if found in batch or DB, null otherwise
 */
export async function resolveEntity<T extends Entity>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: string,
  entityClass: EntityConstructor<T>,
  id: string,
): Promise<T | null> {
  // 1. Check batch first (current batch)
  const batchEntity = batchCtx.getEntities<T>(entityType).get(id);
  if (batchEntity) return batchEntity;

  // 2. Check database (previous batches)
  const dbEntity = await store.findOneBy(entityClass, { id } as FindOptionsWhere<T>);
  return dbEntity ?? null;
}

/**
 * Resolve multiple entities from batch and database.
 *
 * Efficient bulk variant: single DB query for all IDs not found in batch.
 * Returns a merged Map with batch entities taking priority over DB entities.
 *
 * This replaces the old mergeEntitiesFromBatchAndDb() with an identical
 * implementation but a clearer name that matches the resolveEntity API.
 *
 * Usage:
 * ```typescript
 * const nfts = await resolveEntities<NFT>(
 *   hctx.store,
 *   hctx.batchCtx,
 *   'NFT',
 *   NFT,
 *   potentialIds
 * );
 * ```
 *
 * @param store        - Subsquid store for DB queries
 * @param batchCtx     - BatchContext for intra-batch entities
 * @param entityType   - Entity type key in BatchContext (e.g., 'NFT')
 * @param entityClass  - TypeORM entity class for DB queries
 * @param ids          - IDs to query from database
 * @returns Map of entity ID to entity, merged from both sources
 */
export async function resolveEntities<T extends Entity>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: string,
  entityClass: EntityConstructor<T>,
  ids: string[],
): Promise<Map<string, T>> {
  // 1. Start with ALL batch entities (preserves intra-batch updates to other entities)
  const batchEntities = batchCtx.getEntities<T>(entityType);
  const merged = new Map<string, T>(batchEntities);

  // 2. Query DB for requested IDs not already in batch
  const idsNotInBatch = ids.filter((id) => !batchEntities.has(id));
  if (idsNotInBatch.length > 0) {
    const dbEntities = await store.findBy(entityClass, {
      id: In(idsNotInBatch),
    } as FindOptionsWhere<T>);
    for (const entity of dbEntities) {
      merged.set(entity.id, entity);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Deprecated (for backward compatibility during migration)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use resolveEntities instead. This is a temporary wrapper
 * to avoid breaking the build while handlers are being migrated.
 * Will be removed in Phase 5.3 Plan 04.
 */
export async function mergeEntitiesFromBatchAndDb<T extends Entity>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: string,
  entityClass: EntityConstructor<T>,
  ids: string[],
): Promise<Map<string, T>> {
  return resolveEntities(store, batchCtx, entityType, entityClass, ids);
}
