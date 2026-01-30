/**
 * Shared populate and persist helpers for plugins.
 *
 * These extract the most common patterns found across event plugins:
 *   - Populate: validate addresses by category, link to parent, remove invalid
 *   - Persist: insert or upsert entity maps from BatchContext
 *
 * Plugins import these helpers instead of duplicating the same loops.
 */
import { DigitalAsset, NFT, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { EntityCategory, IBatchContext } from './types';

// ---------------------------------------------------------------------------
// Populate helpers
// ---------------------------------------------------------------------------

/**
 * Populate entities that require a verified UniversalProfile.
 *
 * Links `entity.universalProfile` for valid addresses, removes entity if invalid.
 * Used by: Executed, UniversalReceiver.
 */
export function populateByUP<T extends { address: string; universalProfile?: unknown }>(
  ctx: IBatchContext,
  entityType: string,
): void {
  const entities = ctx.getEntities<T>(entityType);

  for (const [id, entity] of entities) {
    if (ctx.isValid(EntityCategory.UniversalProfile, entity.address)) {
      entity.universalProfile = new UniversalProfile({ id: entity.address });
    } else {
      ctx.removeEntity(entityType, id);
    }
  }
}

/**
 * Populate entities that require a verified DigitalAsset.
 *
 * Links `entity.digitalAsset` for valid addresses, removes entity if invalid.
 * Used by: LSP7Transfer, and the NFT sub-loop in LSP8Transfer/TokenIdDataChanged.
 */
export function populateByDA<T extends { address: string; digitalAsset?: unknown }>(
  ctx: IBatchContext,
  entityType: string,
): void {
  const entities = ctx.getEntities<T>(entityType);

  for (const [id, entity] of entities) {
    if (ctx.isValid(EntityCategory.DigitalAsset, entity.address)) {
      entity.digitalAsset = new DigitalAsset({ id: entity.address });
    } else {
      ctx.removeEntity(entityType, id);
    }
  }
}

/**
 * Populate entities that may belong to either a UniversalProfile or DigitalAsset.
 *
 * Links whichever parent(s) the address verified as. Removes entity if neither.
 * An address can be both a UP and a DA.
 * Used by: OwnershipTransferred, DataChanged.
 */
export function populateByUPAndDA<
  T extends { address: string; universalProfile?: unknown; digitalAsset?: unknown },
>(ctx: IBatchContext, entityType: string): void {
  const entities = ctx.getEntities<T>(entityType);

  for (const [id, entity] of entities) {
    const isUP = ctx.isValid(EntityCategory.UniversalProfile, entity.address);
    const isDA = ctx.isValid(EntityCategory.DigitalAsset, entity.address);

    if (!isUP && !isDA) {
      ctx.removeEntity(entityType, id);
      continue;
    }

    entity.universalProfile = isUP ? new UniversalProfile({ id: entity.address }) : null;
    entity.digitalAsset = isDA ? new DigitalAsset({ id: entity.address }) : null;
  }
}

/**
 * Populate NFT entities — link to verified DigitalAsset or remove.
 *
 * Identical loop used by LSP8Transfer and TokenIdDataChanged.
 */
export function populateNFTs(ctx: IBatchContext, nftType: string = 'NFT'): void {
  populateByDA<NFT>(ctx, nftType);
}

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
