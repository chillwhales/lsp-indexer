/**
 * Shared handler helpers for EntityHandler handle() methods.
 *
 * Provides reusable patterns for handlers that need to merge entities
 * from both the current batch (BatchContext) and the database. This ensures
 * handlers never lose data by relying only on batch context or only on
 * database queries.
 *
 * Core pattern:
 * 1. Load entities from BatchContext (intra-batch updates)
 * 2. Load entities from database (cross-batch persistence)
 * 3. Merge both sources into a single map
 * 4. Process and update entities
 * 5. Add back to BatchContext for pipeline persistence
 */
import { Entity, IBatchContext } from '@/core/types';
import { Store } from '@subsquid/typeorm-store';
import { FindOptionsWhere, In } from 'typeorm';

// ---------------------------------------------------------------------------
// Entity merging utilities
// ---------------------------------------------------------------------------

/**
 * Merge entities from both BatchContext and database.
 *
 * This is the CORRECT pattern for handlers that need to check for existing entities.
 * Never rely solely on BatchContext (intra-batch only) or solely on database
 * (misses current batch updates). Always merge both sources.
 *
 * Usage:
 * ```typescript
 * const nfts = await mergeEntitiesFromBatchAndDb<NFT>(
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
 * @param idsToCheck   - IDs to query from database (optional, queries all if not provided)
 * @returns Map of entity ID to entity, merged from both sources
 */
export async function mergeEntitiesFromBatchAndDb<T extends Entity>(
  store: Store,
  batchCtx: IBatchContext,
  entityType: string,
  entityClass: new (props?: Partial<T>) => T,
  idsToCheck?: string[],
): Promise<Map<string, T>> {
  // Step 1: Get entities from current batch (intra-batch updates)
  const batchEntities = batchCtx.getEntities<T>(entityType);
  const merged = new Map<string, T>(batchEntities);

  // Step 2: Query database for entities not already in batch
  if (idsToCheck && idsToCheck.length > 0) {
    const idsNotInBatch = idsToCheck.filter((id) => !merged.has(id));

    if (idsNotInBatch.length > 0) {
      const dbEntities = await store.findBy(entityClass, {
        id: In(idsNotInBatch),
      } as FindOptionsWhere<T>);

      // Step 3: Merge database entities into the map
      for (const entity of dbEntities) {
        merged.set(entity.id, entity);
      }
    }
  }

  return merged;
}
