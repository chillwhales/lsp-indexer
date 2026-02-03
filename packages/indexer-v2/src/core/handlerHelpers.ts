/**
 * Shared handler helpers for EntityHandler handle() methods.
 *
 * These provide reusable patterns for handlers that need to merge entities
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
import { generateOwnedAssetId, generateOwnedTokenId } from '@/utils';
import {
  OwnedAsset,
  OwnedToken,
  TotalSupply,
  Transfer,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { FindOptionsWhere, In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

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

// ---------------------------------------------------------------------------
// Total supply
// ---------------------------------------------------------------------------

/**
 * @deprecated Dead code — will be refactored into a standalone EntityHandler in #105.
 *
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

// ---------------------------------------------------------------------------
// Owned assets and tokens
// ---------------------------------------------------------------------------

/**
 * @deprecated Dead code — will be refactored into a standalone EntityHandler in #105.
 *
 * Update OwnedAsset and OwnedToken entities based on Transfer events.
 *
 * For each transfer:
 * - Decrements sender's OwnedAsset balance (if existing record found)
 * - Increments receiver's OwnedAsset balance (creates new if first-time holder)
 * - For LSP8 (NFTs): nulls sender's OwnedToken tokenId (marks for deletion),
 *   creates/restores receiver's OwnedToken
 * - Removes OwnedAsset entities with zero balance
 * - Removes OwnedToken entities with null tokenId
 * - Links to verified UniversalProfile when creating new entities
 *
 * Called from both LSP7Transfer.handle() and LSP8Transfer.handle().
 * Because handlers run sequentially, the second plugin reads the first
 * plugin's updates from the DB.
 *
 * Port from v1:
 *   - handlers/ownedAssetsHandler.ts
 *   - utils/transfer/ownedAsset.ts
 *   - utils/transfer/ownedToken.ts
 *
 * @param store     - Subsquid store for DB operations
 * @param transfers - Transfer entities from the calling plugin's BatchContext
 * @param validUPs  - Set of verified UniversalProfile addresses
 */
export async function updateOwnedAssets(
  store: Store,
  transfers: Transfer[],
  validUPs: Set<string>,
): Promise<void> {
  if (transfers.length === 0) return;

  // Collect all potential OwnedAsset and OwnedToken IDs
  const ownedAssetIds = new Set<string>();
  const ownedTokenIds = new Set<string>();

  for (const { address, from, to, tokenId } of transfers) {
    if (!isAddressEqual(getAddress(from), zeroAddress)) {
      ownedAssetIds.add(generateOwnedAssetId({ owner: from, address }));
    }
    if (!isAddressEqual(getAddress(to), zeroAddress)) {
      ownedAssetIds.add(generateOwnedAssetId({ owner: to, address }));
    }

    if (tokenId) {
      if (!isAddressEqual(getAddress(from), zeroAddress)) {
        ownedTokenIds.add(generateOwnedTokenId({ owner: from, address, tokenId }));
      }
      if (!isAddressEqual(getAddress(to), zeroAddress)) {
        ownedTokenIds.add(generateOwnedTokenId({ owner: to, address, tokenId }));
      }
    }
  }

  // Load existing entities from database
  const [existingOwnedAssetsMap, existingOwnedTokensMap] = await Promise.all([
    ownedAssetIds.size > 0
      ? store
          .findBy(OwnedAsset, { id: In([...ownedAssetIds]) })
          .then((entities) => new Map(entities.map((e) => [e.id, e])))
      : Promise.resolve(new Map<string, OwnedAsset>()),
    ownedTokenIds.size > 0
      ? store
          .findBy(OwnedToken, { id: In([...ownedTokenIds]) })
          .then((entities) => new Map(entities.map((e) => [e.id, e])))
      : Promise.resolve(new Map<string, OwnedToken>()),
  ]);

  const updatedOwnedAssetsMap = new Map<string, OwnedAsset>();
  const updatedOwnedTokensMap = new Map<string, OwnedToken>();

  for (const transfer of transfers) {
    const { timestamp, blockNumber, address, from, to, amount, tokenId, digitalAsset, nft } =
      transfer;

    // --- OwnedAsset: decrement sender (floor at 0 to prevent underflow) ---
    if (!isAddressEqual(getAddress(from), zeroAddress)) {
      const fromId = generateOwnedAssetId({ owner: from, address });
      const existing = updatedOwnedAssetsMap.get(fromId) ?? existingOwnedAssetsMap.get(fromId);

      if (existing) {
        const newBalance = existing.balance >= amount ? existing.balance - amount : 0n;
        updatedOwnedAssetsMap.set(
          fromId,
          new OwnedAsset({
            ...existing,
            block: blockNumber,
            timestamp,
            balance: newBalance,
          }),
        );
      }
    }

    // --- OwnedAsset: increment receiver ---
    if (!isAddressEqual(getAddress(to), zeroAddress)) {
      const toId = generateOwnedAssetId({ owner: to, address });
      const existing = updatedOwnedAssetsMap.get(toId) ?? existingOwnedAssetsMap.get(toId);

      if (existing) {
        updatedOwnedAssetsMap.set(
          toId,
          new OwnedAsset({
            ...existing,
            block: blockNumber,
            timestamp,
            balance: existing.balance + amount,
          }),
        );
      } else {
        // Create new OwnedAsset for first-time holder
        updatedOwnedAssetsMap.set(
          toId,
          new OwnedAsset({
            id: toId,
            block: blockNumber,
            timestamp,
            balance: amount,
            address,
            owner: to,
            digitalAsset,
            universalProfile: validUPs.has(to) ? new UniversalProfile({ id: to }) : null,
          }),
        );
      }
    }

    // --- OwnedToken: remove from sender ---
    if (tokenId && !isAddressEqual(getAddress(from), zeroAddress)) {
      const fromId = generateOwnedTokenId({ owner: from, address, tokenId });
      const existing = updatedOwnedTokensMap.get(fromId) ?? existingOwnedTokensMap.get(fromId);

      if (existing) {
        updatedOwnedTokensMap.set(
          fromId,
          new OwnedToken({
            ...existing,
            block: blockNumber,
            timestamp,
            tokenId: null,
          }),
        );
      }
    }

    // --- OwnedToken: add to receiver ---
    if (tokenId && !isAddressEqual(getAddress(to), zeroAddress)) {
      const toId = generateOwnedTokenId({ owner: to, address, tokenId });
      const existing = updatedOwnedTokensMap.get(toId) ?? existingOwnedTokensMap.get(toId);

      if (existing) {
        updatedOwnedTokensMap.set(
          toId,
          new OwnedToken({
            ...existing,
            block: blockNumber,
            timestamp,
            tokenId,
          }),
        );
      } else {
        // Create new OwnedToken for receiver.
        // Only set the ownedAsset FK if the parent entity exists (in this batch or in DB)
        // to avoid referencing a non-existent row.
        const parentAssetId = generateOwnedAssetId({ owner: to, address });
        const parentExists =
          updatedOwnedAssetsMap.has(parentAssetId) || existingOwnedAssetsMap.has(parentAssetId);

        updatedOwnedTokensMap.set(
          toId,
          new OwnedToken({
            id: toId,
            block: blockNumber,
            timestamp,
            address,
            tokenId,
            owner: to,
            nft,
            digitalAsset,
            universalProfile: validUPs.has(to) ? new UniversalProfile({ id: to }) : null,
            ownedAsset: parentExists ? new OwnedAsset({ id: parentAssetId }) : null,
          }),
        );
      }
    }
  }

  // Separate entities to save vs delete
  const ownedAssetsToSave = [...updatedOwnedAssetsMap.values()].filter(
    ({ balance }) => balance > 0n,
  );
  const ownedAssetsToDelete = [...updatedOwnedAssetsMap.values()].filter(
    ({ balance }) => balance === 0n,
  );

  const ownedTokensToSave = [...updatedOwnedTokensMap.values()].filter(({ tokenId }) => tokenId);
  const ownedTokensToDelete = [...updatedOwnedTokensMap.values()].filter(({ tokenId }) => !tokenId);

  // Execute database operations (order matches v1: upsert assets, remove tokens, remove assets, upsert tokens)
  if (ownedAssetsToSave.length > 0) {
    await store.upsert(ownedAssetsToSave);
  }
  if (ownedTokensToDelete.length > 0) {
    await store.remove(ownedTokensToDelete);
  }
  if (ownedAssetsToDelete.length > 0) {
    await store.remove(ownedAssetsToDelete);
  }
  if (ownedTokensToSave.length > 0) {
    await store.upsert(ownedTokensToSave);
  }
}
