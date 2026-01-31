/**
 * Shared populate helpers for plugins.
 *
 * These extract the most common populate patterns found across plugins:
 * validate addresses by category, link to verified parent entity, remove invalid.
 *
 * Plugins import these helpers instead of duplicating the same loops.
 */
import { DigitalAsset, NFT, UniversalProfile } from '@chillwhales/typeorm';

import { EntityCategory, IBatchContext } from './types';

// ---------------------------------------------------------------------------
// Populate helpers
// ---------------------------------------------------------------------------

/**
 * Populate entities that require a verified UniversalProfile.
 *
 * Links `entity.universalProfile` for valid addresses, removes entity if invalid.
 * Used by: Executed, UniversalReceiver, LSP5ReceivedAssets.
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
 * Enrich entities with an optional FK linking a secondary address to a verified entity.
 *
 * Unlike the primary populate helpers (populateByUP/populateByDA), this does NOT
 * remove entities when the address is unverified — it sets the FK to null instead.
 * Should be called after the primary populate pass so only surviving entities are enriched.
 *
 * @param ctx          - BatchContext with entities
 * @param entityType   - Entity type key in the BatchContext bag
 * @param category     - Entity category to verify against (UP or DA)
 * @param addressField - Entity field containing the address to verify (e.g. 'creatorAddress')
 * @param fkField      - Entity field to write the FK reference to (e.g. 'creatorProfile')
 */
export function enrichEntityFk(
  ctx: IBatchContext,
  entityType: string,
  category: EntityCategory,
  addressField: string,
  fkField: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities = ctx.getEntities<Record<string, any>>(entityType);
  const createRef =
    category === EntityCategory.UniversalProfile
      ? (addr: string) => new UniversalProfile({ id: addr })
      : (addr: string) => new DigitalAsset({ id: addr });

  for (const entity of entities.values()) {
    const addr = entity[addressField] as string;
    entity[fkField] = ctx.isValid(category, addr) ? createRef(addr) : null;
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
