/**
 * LSP4TokenType data key plugin.
 *
 * Handles the `LSP4TokenType` data key emitted via `DataChanged(bytes32,bytes)`
 * on Digital Assets. Decodes the hex-encoded token type enum value
 * (0 = TOKEN, 1 = NFT, 2 = COLLECTION).
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4TokenType.ts (extract + populate)
 *   - app/index.ts L428 (upsert)
 */
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

import { LSP4TokenType } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { hexToNumber, isHex } from 'viem';

import { upsertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeTokenType } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenType';

const LSP4_TOKEN_TYPE_KEY: string = LSP4DataKeys.LSP4TokenType;

const LSP4TokenTypePlugin: DataKeyPlugin = {
  name: 'lsp4TokenType',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP4_TOKEN_TYPE_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP4TokenType({
      id: address,
      address,
      timestamp: new Date(timestamp),
      value:
        !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenType(hexToNumber(dataValue)),
      rawValue: dataValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP4TokenType>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP4TokenTypePlugin;
