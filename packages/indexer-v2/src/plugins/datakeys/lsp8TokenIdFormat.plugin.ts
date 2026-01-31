/**
 * LSP8TokenIdFormat data key plugin.
 *
 * Handles the `LSP8TokenIdFormat` data key emitted via
 * `DataChanged(bytes32,bytes)` on Digital Assets. Decodes the token ID
 * encoding format used by the LSP8 identifiable digital asset.
 *
 * Standard values: 0 = NUMBER, 1 = STRING, 2 = ADDRESS, 3/4 = BYTES32.
 * Legacy values (100+) are also supported.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp8TokenIdFormat.ts
 *   - app/index.ts L456 (upsert)
 */
import { LSP8DataKeys } from '@lukso/lsp8-contracts';

import { LSP8TokenIdFormat } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { hexToNumber, isHex } from 'viem';

import { upsertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeTokenIdFormat } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8TokenIdFormat';

const LSP8_TOKEN_ID_FORMAT_KEY: string = LSP8DataKeys.LSP8TokenIdFormat;

const LSP8TokenIdFormatPlugin: DataKeyPlugin = {
  name: 'lsp8TokenIdFormat',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP8_TOKEN_ID_FORMAT_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP8TokenIdFormat({
      id: address,
      address,
      timestamp: new Date(timestamp),
      value:
        !isHex(dataValue) || dataValue === '0x'
          ? null
          : decodeTokenIdFormat(hexToNumber(dataValue)),
      rawValue: dataValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP8TokenIdFormat>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP8TokenIdFormatPlugin;
