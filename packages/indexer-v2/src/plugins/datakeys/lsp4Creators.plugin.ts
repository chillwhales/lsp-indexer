/**
 * LSP4Creators data key plugin.
 *
 * Handles three related `LSP4Creators` data key patterns emitted via
 * `DataChanged(bytes32,bytes)` on Digital Assets:
 *
 *   1. **LSP4Creators[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of creators.
 *      Entity: `LSP4CreatorsLength` (deterministic id = address).
 *
 *   2. **LSP4Creators[] index** — prefix match on `0x114bd03b3a46d48759680d81ebb2b414`.
 *      Decodes a creator address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *      Entity: `LSP4CreatorsItem` (deterministic id = `"{address} - {dataKey}"`).
 *
 *   3. **LSP4CreatorsMap** — prefix match on `0x6de85eaf5d982b4e5da00000`.
 *      Decodes the mapped creator address from the data key (last 20 bytes),
 *      plus interface ID and index from the data value.
 *      Entity: `LSP4CreatorsMap` (deterministic id = `"{address} - {dataKey}"`).
 *
 * All three entity types are linked to a verified DigitalAsset.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4CreatorsLength.ts
 *   - utils/dataChanged/lsp4CreatorsItem.ts
 *   - utils/dataChanged/lsp4CreatorsMap.ts
 *   - app/scanner.ts L203-267 (DataChanged case → LSP4Creators routing)
 *   - app/index.ts L432-436 (upsert)
 */
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

import { LSP4CreatorsItem, LSP4CreatorsLength, LSP4CreatorsMap } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

import { populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP4CreatorsLength';
const ITEM_TYPE = 'LSP4CreatorsItem';
const MAP_TYPE = 'LSP4CreatorsMap';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP4_CREATORS_LENGTH_KEY: string = LSP4DataKeys['LSP4Creators[]'].length;
const LSP4_CREATORS_INDEX_PREFIX: string = LSP4DataKeys['LSP4Creators[]'].index;
const LSP4_CREATORS_MAP_PREFIX: string = LSP4DataKeys.LSP4CreatorsMap;

const LSP4CreatorsPlugin: DataKeyPlugin = {
  name: 'lsp4Creators',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return (
      dataKey === LSP4_CREATORS_LENGTH_KEY ||
      dataKey.startsWith(LSP4_CREATORS_INDEX_PREFIX) ||
      dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)
    );
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    if (dataKey === LSP4_CREATORS_LENGTH_KEY) {
      extractLength(address, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP4_CREATORS_INDEX_PREFIX)) {
      extractItem(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)) {
      extractMap(address, dataKey, dataValue, timestamp, ctx);
    }

    // Address tracking is handled by the DataChanged meta-plugin (parent)
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP4CreatorsLength>(ctx, LENGTH_TYPE);
    populateByDA<LSP4CreatorsItem>(ctx, ITEM_TYPE);
    populateByDA<LSP4CreatorsMap>(ctx, MAP_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await Promise.all([
      upsertEntities(store, ctx, LENGTH_TYPE),
      upsertEntities(store, ctx, ITEM_TYPE),
      upsertEntities(store, ctx, MAP_TYPE),
    ]);
  },
};

// ---------------------------------------------------------------------------
// Extract helpers (one per entity type)
// ---------------------------------------------------------------------------

/**
 * Extract LSP4CreatorsLength.
 *
 * dataValue should be 16 bytes (uint128). If not, value is stored as null.
 * Deterministic id = address (one length entity per digital asset).
 */
function extractLength(
  address: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const entity = new LSP4CreatorsLength({
    id: address,
    address,
    timestamp: new Date(timestamp),
    value:
      isHex(dataValue) && hexToBytes(dataValue as Hex).length === 16
        ? hexToBigInt(dataValue as Hex)
        : null,
    rawValue: dataValue,
  });

  ctx.addEntity(LENGTH_TYPE, entity.id, entity);
}

/**
 * Extract LSP4CreatorsItem.
 *
 * creatorAddress: decoded from dataValue if exactly 20 bytes, else null.
 * creatorIndex: last 16 bytes of dataKey converted to BigInt.
 * Deterministic id = `"{address} - {dataKey}"`.
 */
function extractItem(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const entity = new LSP4CreatorsItem({
    id: `${address} - ${dataKey}`,
    address,
    timestamp: new Date(timestamp),
    creatorAddress:
      isHex(dataValue) && hexToBytes(dataValue as Hex).length === 20 ? dataValue : null,
    creatorIndex: bytesToBigInt(hexToBytes(dataKey as Hex).slice(16)),
    rawValue: dataValue,
  });

  ctx.addEntity(ITEM_TYPE, entity.id, entity);
}

/**
 * Extract LSP4CreatorsMap.
 *
 * creatorAddress: last 20 bytes of dataKey (bytes 12..32).
 * creatorInterfaceId: first 4 bytes of dataValue (if value is 20 bytes).
 * creatorIndex: bytes 4..20 of dataValue (if value is 20 bytes).
 * Deterministic id = `"{address} - {dataKey}"`.
 */
function extractMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue as Hex) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const entity = new LSP4CreatorsMap({
    id: `${address} - ${dataKey}`,
    address,
    timestamp: new Date(timestamp),
    creatorAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
    creatorInterfaceId: isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null,
    creatorIndex: isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null,
    rawValue: dataValue,
  });

  ctx.addEntity(MAP_TYPE, entity.id, entity);
}

export default LSP4CreatorsPlugin;
