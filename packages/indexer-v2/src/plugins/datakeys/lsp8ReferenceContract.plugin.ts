/**
 * LSP8ReferenceContract data key plugin.
 *
 * Handles the `LSP8ReferenceContract` data key emitted via
 * `DataChanged(bytes32,bytes)` on Digital Assets. Stores the raw hex
 * reference contract address value.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp8ReferenceContract.ts
 *   - app/index.ts L458 (upsert)
 */
import { LSP8DataKeys } from '@lukso/lsp8-contracts';

import { LSP8ReferenceContract } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { isHex } from 'viem';

import { populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8ReferenceContract';

const LSP8_REFERENCE_CONTRACT_KEY: string = LSP8DataKeys.LSP8ReferenceContract;

const LSP8ReferenceContractPlugin: DataKeyPlugin = {
  name: 'lsp8ReferenceContract',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP8_REFERENCE_CONTRACT_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP8ReferenceContract({
      id: address,
      address,
      timestamp: new Date(timestamp),
      value: !isHex(dataValue) || dataValue === '0x' ? null : dataValue,
      rawValue: dataValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP8ReferenceContract>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP8ReferenceContractPlugin;
