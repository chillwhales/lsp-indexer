/**
 * TotalSupply entity handler.
 *
 * Subscribes to both LSP7Transfer and LSP8Transfer events. For each batch,
 * it filters for mint (from === zeroAddress) and burn (to === zeroAddress)
 * transfers, loads existing TotalSupply records from the DB and BatchContext,
 * accumulates all deltas in-memory, and writes the final result once.
 *
 * Key behaviors:
 * - Dual-trigger: runs once per trigger ('LSP7Transfer' or 'LSP8Transfer').
 *   Each invocation only reads the triggered bag to prevent double-processing.
 * - Clamps totalSupply to zero on underflow (burn > recorded supply) and
 *   logs a warning.
 * - Queues enrichment for digitalAsset FK — never sets FKs directly.
 * - Uses the contract address as the entity ID (one TotalSupply per contract).
 */
import { resolveEntities } from '@/core/handlerHelpers';
import { EntityCategory, EntityHandler } from '@/core/types';
import { isNullAddress } from '@/utils';
import { TotalSupply, Transfer } from '@chillwhales/typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'TotalSupply';

const TotalSupplyHandler: EntityHandler = {
  name: 'totalSupply',
  listensToBag: ['LSP7Transfer', 'LSP8Transfer'],

  async handle(hctx, triggeredBy): Promise<void> {
    // Only process transfers from the triggered bag (prevents double-processing).
    // The pipeline calls handle() once per subscribed bag key that has entities.
    // Without this guard, reading both bags on each call would apply deltas twice.
    const transfers =
      triggeredBy === 'LSP7Transfer'
        ? hctx.batchCtx.getEntities('LSP7Transfer')
        : triggeredBy === 'LSP8Transfer'
          ? hctx.batchCtx.getEntities('LSP8Transfer')
          : new Map<string, Transfer>();

    // Filter for mint/burn only
    const mintBurnTransfers: Transfer[] = [];

    for (const transfer of transfers.values()) {
      if (
        isAddressEqual(zeroAddress, getAddress(transfer.from)) ||
        isAddressEqual(zeroAddress, getAddress(transfer.to))
      ) {
        mintBurnTransfers.push(transfer);
      }
    }

    if (mintBurnTransfers.length === 0) return;

    // Collect unique contract addresses from filtered transfers
    const addresses = [...new Set(mintBurnTransfers.map(({ address }) => address))];

    // Resolve existing TotalSupply entities from batch + DB
    const existingEntities = await resolveEntities(
      hctx.store,
      hctx.batchCtx,
      ENTITY_TYPE,
      addresses,
    );

    const updatedEntities = new Map<string, TotalSupply>();

    for (const transfer of mintBurnTransfers) {
      const { timestamp, address, from, to, amount } = transfer;

      // Resolve the current entity: check in-progress updates first, then batch/DB merge, then create new
      let entity = updatedEntities.get(address) ?? existingEntities.get(address);

      if (!entity) {
        entity = new TotalSupply({
          id: address,
          timestamp,
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
          address,
          digitalAsset: null,
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
            blockNumber: transfer.blockNumber,
            transactionIndex: transfer.transactionIndex,
            logIndex: transfer.logIndex,
            value: entity.value + amount,
            // Explicitly preserve FK field for enrichment
            digitalAsset: entity.digitalAsset ?? null,
          }),
        );
      }

      // Burn: to === zeroAddress → decrement (clamp at 0)
      if (isAddressEqual(zeroAddress, getAddress(to))) {
        // Re-read from updatedEntities in case the same transfer was a mint+burn
        const current = updatedEntities.get(address) ?? entity;

        if (current.value < amount) {
          console.warn(
            `[totalSupply] Underflow clamped to 0 for address ${address}: ` +
              `recorded=${current.value}, burn=${amount}`,
          );
        }

        updatedEntities.set(
          address,
          new TotalSupply({
            ...current,
            timestamp,
            blockNumber: transfer.blockNumber,
            transactionIndex: transfer.transactionIndex,
            logIndex: transfer.logIndex,
            value: current.value > amount ? current.value - amount : 0n,
            // Explicitly preserve FK field for enrichment
            digitalAsset: current.digitalAsset ?? null,
          }),
        );
      }
    }

    if (updatedEntities.size === 0) return;

    // Add all updated entities to BatchContext + queue enrichment
    for (const [address, entity] of updatedEntities) {
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK (skip null addresses)
      if (!isNullAddress(address)) {
        hctx.batchCtx.queueEnrichment<TotalSupply>({
          category: EntityCategory.DigitalAsset,
          address,
          entityType: ENTITY_TYPE,
          entityId: entity.id,
          fkField: 'digitalAsset',
          blockNumber: entity.blockNumber,
          transactionIndex: entity.transactionIndex,
          logIndex: entity.logIndex,
          timestamp: entity.timestamp.getTime(),
        });
      }
    }
  },
};

export default TotalSupplyHandler;
