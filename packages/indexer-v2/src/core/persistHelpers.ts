/**
 * Shared persist helpers for plugins.
 *
 * These extract the most common persist patterns found across plugins:
 * insert, upsert, insert-if-new, and merge-upsert from BatchContext to store.
 *
 * Plugins import these helpers instead of duplicating the same loops.
 */
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { IBatchContext } from './types';

// ---------------------------------------------------------------------------
// Persist helpers
// ---------------------------------------------------------------------------

/**
 * Insert entities from BatchContext into the store (append-only).
 *
 * Used by most plugins for event log entities with UUID ids.
 */
export async function insertEntities<T extends { id: string }>(
  store: Store,
  ctx: IBatchContext,
  entityType: string,
): Promise<void> {
  const entities = ctx.getEntities<T>(entityType);
  if (entities.size > 0) {
    await store.insert([...entities.values()]);
  }
}

/**
 * Upsert entities from BatchContext into the store.
 *
 * Used for entities with deterministic ids (e.g. NFTs, Followers).
 */
export async function upsertEntities<T extends { id: string }>(
  store: Store,
  ctx: IBatchContext,
  entityType: string,
): Promise<void> {
  const entities = ctx.getEntities<T>(entityType);
  if (entities.size > 0) {
    await store.upsert([...entities.values()]);
  }
}

/**
 * Insert entities from BatchContext that don't already exist in the store.
 *
 * Used when a plugin creates entities with deterministic IDs but should NOT
 * overwrite existing records set by another plugin. Reads existing DB records
 * first and only inserts truly new ones.
 *
 * Example: TokenIdDataChanged creates NFT stubs (isMinted: false, isBurned: false)
 * for FK references, but must not overwrite isMinted/isBurned values set by
 * LSP8Transfer in prior batches.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertNewEntities<T extends { id: string }>(
  store: Store,
  ctx: IBatchContext,
  entityType: string,
  EntityClass: new (...args: any[]) => T,
): Promise<void> {
  const entities = ctx.getEntities<T>(entityType);
  if (entities.size === 0) return;

  const ids = [...entities.keys()];
  const existing = await store.findBy(EntityClass as any, { id: In(ids) } as any);
  const existingIds = new Set(existing.map((e: T) => e.id));
  const newEntities = [...entities.values()].filter((e) => !existingIds.has(e.id));

  if (newEntities.length > 0) {
    await store.insert(newEntities);
  }
}

/**
 * Merge-upsert entities from BatchContext into the store.
 *
 * Used for merged entities (e.g. LSP4Creator, LSP5ReceivedAsset) where
 * different data key sources (Index vs Map) populate different fields of
 * the same entity. When only one source fires in a batch, the other
 * fields would be null — a plain upsert would wipe existing DB values.
 *
 * This helper reads existing DB records first, then for each specified
 * merge field: keeps the existing non-null value when the new entity
 * has null for that field. New non-null values always win.
 *
 * @param store     - Subsquid store
 * @param ctx       - BatchContext with entities to persist
 * @param entityType - Entity type key in the BatchContext bag
 * @param EntityClass - TypeORM entity class (for store.findBy)
 * @param mergeFields - Field names to preserve from existing DB records
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mergeUpsertEntities<T extends { id: string; [key: string]: any }>(
  store: Store,
  ctx: IBatchContext,
  entityType: string,
  EntityClass: new (...args: any[]) => T,
  mergeFields: (keyof T & string)[],
): Promise<void> {
  const entities = ctx.getEntities<T>(entityType);
  if (entities.size === 0) return;

  // Read existing DB records for the IDs in this batch
  const ids = [...entities.keys()];
  const existing = await store.findBy(EntityClass as any, { id: In(ids) } as any);
  const existingMap = new Map(existing.map((e: T) => [e.id, e]));

  // Merge: keep existing non-null values when the new entity has null
  for (const [id, entity] of entities) {
    const prev = existingMap.get(id);
    if (prev) {
      for (const field of mergeFields) {
        if (entity[field] == null && prev[field] != null) {
          entity[field] = prev[field];
        }
      }
    }
  }

  await store.upsert([...entities.values()]);
}
