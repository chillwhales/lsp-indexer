/**
 * LSP4TokenSymbol data key plugin.
 *
 * Handles the `LSP4TokenSymbol` data key emitted via `DataChanged(bytes32,bytes)`
 * on Digital Assets. Decodes the hex-encoded token symbol string.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4TokenSymbol.ts (extract + populate)
 *   - app/index.ts L427 (upsert)
 */
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

import { LSP4TokenSymbol } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { hexToString, isHex } from 'viem';

import { upsertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenSymbol';

const LSP4_TOKEN_SYMBOL_KEY: string = LSP4DataKeys.LSP4TokenSymbol;

const LSP4TokenSymbolPlugin: DataKeyPlugin = {
  name: 'lsp4TokenSymbol',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP4_TOKEN_SYMBOL_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP4TokenSymbol({
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
    populateByDA<LSP4TokenSymbol>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP4TokenSymbolPlugin;
