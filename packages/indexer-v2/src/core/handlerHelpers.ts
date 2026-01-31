/**
 * Shared handler helpers for plugin handle() methods (Phase 5).
 *
 * These provide reusable post-processing logic called from plugin handle()
 * methods. Each helper encapsulates a DB read-modify-write pattern that
 * would otherwise be duplicated across plugins.
 *
 * As more Phase 5 handlers are added (#47-#55), new helpers are added here.
 */
import {
  OwnedAsset,
  OwnedToken,
  TotalSupply,
  Transfer,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

import { generateOwnedAssetId, generateOwnedTokenId } from '@/utils';

// ---------------------------------------------------------------------------
// Total supply
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

// ---------------------------------------------------------------------------
// Owned assets and tokens
// ---------------------------------------------------------------------------

/**
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

    // --- OwnedAsset: decrement sender ---
    if (!isAddressEqual(getAddress(from), zeroAddress)) {
      const fromId = generateOwnedAssetId({ owner: from, address });
      const existing = updatedOwnedAssetsMap.get(fromId) ?? existingOwnedAssetsMap.get(fromId);

      if (existing) {
        updatedOwnedAssetsMap.set(
          fromId,
          new OwnedAsset({
            ...existing,
            block: blockNumber,
            timestamp,
            balance: existing.balance - amount,
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
        // Create new OwnedToken for receiver
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
            ownedAsset: new OwnedAsset({ id: generateOwnedAssetId({ owner: to, address }) }),
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
