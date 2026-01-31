/**
 * LSP12IssuedAssets data key plugin.
 *
 * Handles three related `LSP12IssuedAssets` data key patterns emitted via
 * `DataChanged(bytes32,bytes)` on Universal Profiles:
 *
 *   1. **LSP12IssuedAssets[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of issued assets.
 *      Entity: `LSP12IssuedAssetsLength` (deterministic id = address).
 *
 *   2. **LSP12IssuedAssets[] index** — prefix match on `0x7c8c3416d6cda87cd42c71ea1843df28`.
 *      Decodes an asset address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *
 *   3. **LSP12IssuedAssetsMap** — prefix match on `0x74ac2555c10b9349e78f0000`.
 *      Decodes the asset address from the data key (last 20 bytes),
 *      plus interface ID and index from the data value.
 *
 * Index and Map events both create/update the same merged `LSP12IssuedAsset`
 * entity keyed by `"{upAddress} - {assetAddress}"`. Both event sources
 * provide assetAddress + arrayIndex; the Map additionally provides
 * interfaceId. If both fire in the same batch (typical), the second
 * upserts into the existing entity, filling in any missing fields.
 *
 * assetAddress is tracked for DigitalAsset verification so the optional
 * `issuedAsset` FK can be populated when the asset is a verified DA.
 *
 * Invalid Item entries (dataValue not a valid 20-byte address) are skipped
 * entirely — no garbage entities to clean up later.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp12IssuedAssetsLength.ts
 *   - utils/dataChanged/lsp12IssuedAssetsItem.ts
 *   - utils/dataChanged/lsp12IssuedAssetsMap.ts
 *   - app/scanner.ts (DataChanged case → LSP12IssuedAssets routing)
 *   - app/index.ts (upsert)
 */
import { LSP12DataKeys } from '@lukso/lsp12-contracts';

import { LSP12IssuedAsset, LSP12IssuedAssetsLength } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

import { mergeUpsertEntities, upsertEntities } from '@/core/persistHelpers';
import { enrichEntityFk, populateByUP } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP12IssuedAssetsLength';
const ISSUED_ASSET_TYPE = 'LSP12IssuedAsset';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP12_ISSUED_ASSETS_LENGTH_KEY: string = LSP12DataKeys['LSP12IssuedAssets[]'].length;
const LSP12_ISSUED_ASSETS_INDEX_PREFIX: string = LSP12DataKeys['LSP12IssuedAssets[]'].index;
const LSP12_ISSUED_ASSETS_MAP_PREFIX: string = LSP12DataKeys.LSP12IssuedAssetsMap;

const LSP12IssuedAssetsPlugin: DataKeyPlugin = {
  name: 'lsp12IssuedAssets',
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return (
      dataKey === LSP12_ISSUED_ASSETS_LENGTH_KEY ||
      dataKey.startsWith(LSP12_ISSUED_ASSETS_INDEX_PREFIX) ||
      dataKey.startsWith(LSP12_ISSUED_ASSETS_MAP_PREFIX)
    );
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    if (dataKey === LSP12_ISSUED_ASSETS_LENGTH_KEY) {
      extractLength(address, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP12_ISSUED_ASSETS_INDEX_PREFIX)) {
      extractFromIndex(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP12_ISSUED_ASSETS_MAP_PREFIX)) {
      extractFromMap(address, dataKey, dataValue, timestamp, ctx);
    }

    // UP address tracking is handled by the DataChanged meta-plugin (parent).
    // Asset addresses are tracked here for DA verification (issuedAsset FK).
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByUP<LSP12IssuedAssetsLength>(ctx, LENGTH_TYPE);
    populateByUP<LSP12IssuedAsset>(ctx, ISSUED_ASSET_TYPE);
    enrichEntityFk(
      ctx,
      ISSUED_ASSET_TYPE,
      EntityCategory.DigitalAsset,
      'assetAddress',
      'issuedAsset',
    );
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
      mergeUpsertEntities(store, ctx, ISSUED_ASSET_TYPE, LSP12IssuedAsset, [
        'arrayIndex',
        'interfaceId',
        'issuedAsset',
      ]),
    ]);
  },
};

// ---------------------------------------------------------------------------
// Extract helpers
// ---------------------------------------------------------------------------

/**
 * Extract LSP12IssuedAssetsLength.
 *
 * dataValue should be 16 bytes (uint128). If not, value is stored as null.
 * Deterministic id = address (one length entity per universal profile).
 */
function extractLength(
  address: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const entity = new LSP12IssuedAssetsLength({
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
 * Extract issued asset from an LSP12IssuedAssets[] index (Item) event.
 *
 * assetAddress: decoded from dataValue (must be exactly 20 bytes).
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * If dataValue is not a valid 20-byte address, the event is skipped
 * (no garbage entity — the Map event will provide the data).
 *
 * Merges into existing LSP12IssuedAsset entity if one was already created
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

  const assetAddress = dataValue;
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = `${address} - ${assetAddress}`;

  // Track asset for DA verification (issuedAsset FK)
  ctx.trackAddress(EntityCategory.DigitalAsset, assetAddress);

  // Check if a Map event already created this entity in the same batch
  const existing = ctx.getEntities<LSP12IssuedAsset>(ISSUED_ASSET_TYPE).get(id);
  if (existing) {
    // Merge: fill in arrayIndex if not already set
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = new Date(timestamp);
    return;
  }

  const entity = new LSP12IssuedAsset({
    id,
    address,
    timestamp: new Date(timestamp),
    assetAddress,
    arrayIndex,
  });

  ctx.addEntity(ISSUED_ASSET_TYPE, entity.id, entity);
}

/**
 * Extract issued asset from an LSP12IssuedAssetsMap event.
 *
 * assetAddress: last 20 bytes of dataKey (bytes 12..32).
 * interfaceId: first 4 bytes of dataValue (if value is 20 bytes).
 * arrayIndex: bytes 4..20 of dataValue (if value is 20 bytes).
 *
 * Merges into existing LSP12IssuedAsset entity if one was already created
 * by an Index event in the same batch.
 */
function extractFromMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const assetAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue as Hex) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const interfaceId = isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null;
  const arrayIndex = isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null;
  const id = `${address} - ${assetAddress}`;

  // Track asset for DA verification (issuedAsset FK)
  ctx.trackAddress(EntityCategory.DigitalAsset, assetAddress);

  // Check if an Index event already created this entity in the same batch
  const existing = ctx.getEntities<LSP12IssuedAsset>(ISSUED_ASSET_TYPE).get(id);
  if (existing) {
    // Merge: Map provides interfaceId + potentially better arrayIndex
    existing.interfaceId = interfaceId ?? existing.interfaceId;
    existing.arrayIndex = arrayIndex ?? existing.arrayIndex;
    existing.timestamp = new Date(timestamp);
    return;
  }

  const entity = new LSP12IssuedAsset({
    id,
    address,
    timestamp: new Date(timestamp),
    assetAddress,
    arrayIndex,
    interfaceId,
  });

  ctx.addEntity(ISSUED_ASSET_TYPE, entity.id, entity);
}

export default LSP12IssuedAssetsPlugin;
