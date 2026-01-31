/**
 * Shared handler helpers for plugin handle() methods (Phase 5).
 *
 * These provide reusable post-processing logic called from plugin handle()
 * methods. Each helper encapsulates a DB read-modify-write pattern that
 * would otherwise be duplicated across plugins.
 *
 * As more Phase 5 handlers are added (#47-#55), new helpers are added here.
 */
import { TotalSupply, Transfer } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

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
