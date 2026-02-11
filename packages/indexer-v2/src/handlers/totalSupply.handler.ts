/**
 * TotalSupply entity handler.
 *
 * Subscribes to both LSP7Transfer and LSP8Transfer events. For each batch,
 * it filters for mint (from === zeroAddress) and burn (to === zeroAddress)
 * transfers, loads existing TotalSupply records from the DB and BatchContext,
 * accumulates all deltas in-memory, and writes the final result once.
 *
 * Key behaviors:
 * - Dual-trigger: runs once per trigger ('LSP7Transfer' or 'LSP8Transfer'),
 *   but accumulates from BOTH bags each time to produce a single consistent
 *   result per batch.
 * - Clamps totalSupply to zero on underflow (burn > recorded supply) and
 *   logs a warning.
 * - Queues enrichment for digitalAsset FK — never sets FKs directly.
 * - Uses the contract address as the entity ID (one TotalSupply per contract).
 *
 * Port from v1:
 *   - core/handlerHelpers.ts → updateTotalSupply() (deleted in 01-04)
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { isNullAddress } from '@/utils';
import { TotalSupply, Transfer } from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'TotalSupply';

const TotalSupplyHandler: EntityHandler = {
  name: 'totalSupply',
  listensToBag: ['LSP7Transfer', 'LSP8Transfer'],

  async handle(hctx: HandlerContext, _triggeredBy: string): Promise<void> {
    // Gather transfers from both LSP7 and LSP8 bags
    const lsp7 = hctx.batchCtx.getEntities<Transfer>('LSP7Transfer');
    const lsp8 = hctx.batchCtx.getEntities<Transfer>('LSP8Transfer');

    // Filter for mint/burn only
    const mintBurnTransfers: Transfer[] = [];

    for (const transfer of lsp7.values()) {
      if (
        isAddressEqual(zeroAddress, getAddress(transfer.from)) ||
        isAddressEqual(zeroAddress, getAddress(transfer.to))
      ) {
        mintBurnTransfers.push(transfer);
      }
    }

    for (const transfer of lsp8.values()) {
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

    // Load existing TotalSupply entities from DB
    const existingEntities = new Map(
      await hctx.store
        .findBy(TotalSupply, { id: In(addresses) })
        .then((entities) => entities.map((entity) => [entity.id, entity])),
    );

    // Also check what's already in the BatchContext (from a previous trigger invocation)
    const batchEntities = hctx.batchCtx.getEntities<TotalSupply>(ENTITY_TYPE);

    const updatedEntities = new Map<string, TotalSupply>();

    for (const transfer of mintBurnTransfers) {
      const { timestamp, address, from, to, amount } = transfer;

      // Resolve the current entity: check in-progress updates first, then batch, then DB, then create new
      let entity =
        updatedEntities.get(address) ?? batchEntities.get(address) ?? existingEntities.get(address);

      if (!entity) {
        entity = new TotalSupply({
          id: address,
          timestamp,
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
        });
      }
    }
  },
};

export default TotalSupplyHandler;
