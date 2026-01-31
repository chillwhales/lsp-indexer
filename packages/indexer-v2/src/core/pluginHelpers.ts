/**
 * Shared populate and persist helpers for plugins.
 *
 * These extract the most common patterns found across event plugins:
 *   - Populate: validate addresses by category, link to parent, remove invalid
 *   - Persist: insert or upsert entity maps from BatchContext
 *
 * Plugins import these helpers instead of duplicating the same loops.
 */
import { DigitalAsset, NFT, TotalSupply, Transfer, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

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

// ---------------------------------------------------------------------------
// Handler helpers
// ---------------------------------------------------------------------------

/**
 * Update TotalSupply entities based on mint/burn transfers.
 *
 * Filters the given Transfer entities for mints (from === zeroAddress) and
 * burns (to === zeroAddress), loads existing TotalSupply records from the DB,
 * accumulates deltas per digital asset address, and upserts the results.
 *
 * Called from LSP7Transfer.handle() and LSP8Transfer.handle() — each plugin
 * passes only its own entities. Because handlers run sequentially, the second
 * plugin reads the first plugin's updates from the DB.
 *
 * @param store     - Subsquid store for DB operations
 * @param transfers - Transfer entities from this plugin's BatchContext
 */
export async function updateTotalSupply(store: Store, transfers: Transfer[]): Promise<void> {
  // Filter for mint/burn only
  const mintBurnTransfers = transfers.filter(
    ({ from, to }) =>
      isAddressEqual(zeroAddress, getAddress(from)) || isAddressEqual(zeroAddress, getAddress(to)),
  );

  if (mintBurnTransfers.length === 0) return;

  // Collect unique contract addresses from filtered transfers
  const addresses = [...new Set(mintBurnTransfers.map(({ address }) => address))];

  // Load existing TotalSupply entities from DB
  const existingEntities = new Map(
    await store
      .findBy(TotalSupply, { id: In(addresses) })
      .then((entities) => entities.map((entity) => [entity.id, entity])),
  );

  const updatedEntities = new Map<string, TotalSupply>();

  for (const transfer of mintBurnTransfers) {
    const { timestamp, address, digitalAsset, from, to, amount } = transfer;

    // Resolve the current entity: check in-progress updates first, then DB, then create new
    let entity = updatedEntities.get(address) ?? existingEntities.get(address);

    if (!entity) {
      entity = new TotalSupply({
        id: address,
        timestamp,
        address,
        digitalAsset,
        value: 0n,
      });
    }

    // Mint: from === zeroAddress → increment
    if (isAddressEqual(zeroAddress, getAddress(from))) {
      updatedEntities.set(
        address,
        new TotalSupply({
          ...entity,
          timestamp,
          value: entity.value + amount,
        }),
      );
    }

    // Burn: to === zeroAddress → decrement (floor at 0)
    if (isAddressEqual(zeroAddress, getAddress(to))) {
      // Re-read from updatedEntities in case the same transfer was a mint+burn
      const current = updatedEntities.get(address) ?? entity;
      updatedEntities.set(
        address,
        new TotalSupply({
          ...current,
          timestamp,
          value: current.value > amount ? current.value - amount : 0n,
        }),
      );
    }
  }

  if (updatedEntities.size > 0) {
    await store.upsert([...updatedEntities.values()]);
  }
}
