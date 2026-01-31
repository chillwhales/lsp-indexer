/**
 * LSP4TokenName data key plugin.
 *
 * Handles the `LSP4TokenName` data key emitted via `DataChanged(bytes32,bytes)`
 * on Digital Assets. Decodes the hex-encoded token name string.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4TokenName.ts (extract + populate)
 *   - app/index.ts L426 (upsert)
 */
import { upsertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { LSP4TokenName } from '@chillwhales/typeorm';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { Store } from '@subsquid/typeorm-store';
import { hexToString, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenName';

const LSP4_TOKEN_NAME_KEY: string = LSP4DataKeys.LSP4TokenName;

const LSP4TokenNamePlugin: DataKeyPlugin = {
  name: 'lsp4TokenName',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP4_TOKEN_NAME_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP4TokenName({
      id: address,
      address,
      timestamp: new Date(timestamp),
      value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
      rawValue: dataValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP4TokenName>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP4TokenNamePlugin;
