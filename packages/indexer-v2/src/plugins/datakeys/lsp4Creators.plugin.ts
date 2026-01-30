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
 *
 *   3. **LSP4CreatorsMap** — prefix match on `0x6de85eaf5d982b4e5da00000`.
 *      Decodes the creator address from the data key (last 20 bytes),
 *      plus interface ID and index from the data value.
 *
 * Index and Map events both create/update the same merged `LSP4Creator`
 * entity keyed by `"{daAddress} - {creatorAddress}"`. Both event sources
 * provide creatorAddress + arrayIndex; the Map additionally provides
 * interfaceId. If both fire in the same batch (typical), the second
 * upserts into the existing entity, filling in any missing fields.
 *
 * Invalid Item entries (dataValue not a valid 20-byte address) are skipped
 * entirely — no garbage entities to clean up later.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4CreatorsLength.ts
 *   - utils/dataChanged/lsp4CreatorsItem.ts
 *   - utils/dataChanged/lsp4CreatorsMap.ts
 *   - app/scanner.ts L203-267 (DataChanged case → LSP4Creators routing)
 *   - app/index.ts L432-436 (upsert)
 */
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

import { LSP4Creator, LSP4CreatorsLength } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

import { mergeUpsertEntities, populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP4CreatorsLength';
const CREATOR_TYPE = 'LSP4Creator';

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
      extractFromIndex(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)) {
      extractFromMap(address, dataKey, dataValue, timestamp, ctx);
    }

    // Address tracking is handled by the DataChanged meta-plugin (parent)
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP4CreatorsLength>(ctx, LENGTH_TYPE);
    populateByDA<LSP4Creator>(ctx, CREATOR_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await Promise.all([
      upsertEntities(store, ctx, LENGTH_TYPE),
      // Merge-upsert: preserve existing non-null fields from prior batches.
      // An Index-only event in this batch should not wipe interfaceId set
      // by a Map event in a prior batch, and vice versa.
      mergeUpsertEntities(store, ctx, CREATOR_TYPE, LSP4Creator, ['arrayIndex', 'interfaceId']),
    ]);
  },
};

// ---------------------------------------------------------------------------
// Extract helpers
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
 * Extract creator from an LSP4Creators[] index (Item) event.
 *
 * creatorAddress: decoded from dataValue (must be exactly 20 bytes).
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * If dataValue is not a valid 20-byte address, the event is skipped
 * (no garbage entity — the Map event will provide the data).
 *
 * Merges into existing LSP4Creator entity if one was already created
 * by a Map event in the same batch.
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue as Hex).length !== 20) return;

  const creatorAddress = dataValue;
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = `${address} - ${creatorAddress}`;

  // Check if a Map event already created this entity in the same batch
  const existing = ctx.getEntities<LSP4Creator>(CREATOR_TYPE).get(id);
  if (existing) {
    // Merge: fill in arrayIndex if not already set
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = new Date(timestamp);
    return;
  }

  const entity = new LSP4Creator({
    id,
    address,
    timestamp: new Date(timestamp),
    creatorAddress,
    arrayIndex,
  });

  ctx.addEntity(CREATOR_TYPE, entity.id, entity);
}

/**
 * Extract creator from an LSP4CreatorsMap event.
 *
 * creatorAddress: last 20 bytes of dataKey (bytes 12..32).
 * interfaceId: first 4 bytes of dataValue (if value is 20 bytes).
 * arrayIndex: bytes 4..20 of dataValue (if value is 20 bytes).
 *
 * Merges into existing LSP4Creator entity if one was already created
 * by an Index event in the same batch.
 */
function extractFromMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const creatorAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue as Hex) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const interfaceId = isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null;
  const arrayIndex = isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null;
  const id = `${address} - ${creatorAddress}`;

  // Check if an Index event already created this entity in the same batch
  const existing = ctx.getEntities<LSP4Creator>(CREATOR_TYPE).get(id);
  if (existing) {
    // Merge: Map provides interfaceId + potentially better arrayIndex
    existing.interfaceId = interfaceId ?? existing.interfaceId;
    existing.arrayIndex = arrayIndex ?? existing.arrayIndex;
    existing.timestamp = new Date(timestamp);
    return;
  }

  const entity = new LSP4Creator({
    id,
    address,
    timestamp: new Date(timestamp),
    creatorAddress,
    arrayIndex,
    interfaceId,
  });

  ctx.addEntity(CREATOR_TYPE, entity.id, entity);
}

export default LSP4CreatorsPlugin;
