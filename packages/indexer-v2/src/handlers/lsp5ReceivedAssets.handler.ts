/**
 * LSP5ReceivedAssets entity handler.
 *
 * Subscribes to DataChanged events and creates two types of entities from
 * three related LSP5ReceivedAssets data key patterns:
 *
 *   1. **LSP5ReceivedAssets[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of received assets.
 *      Entity: `LSP5ReceivedAssetsLength` (deterministic id = address).
 *
 *   2. **LSP5ReceivedAssets[] index** — prefix match on the index prefix.
 *      Decodes an asset address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *
 *   3. **LSP5ReceivedAssetsMap** — prefix match on the map prefix.
 *      Decodes the asset address from the data key (last 20 bytes),
 *      plus interface ID and index from the data value.
 *
 * Index and Map events both create/update the same merged `LSP5ReceivedAsset`
 * entity keyed by `"{upAddress} - {assetAddress}"`. Both event sources
 * provide assetAddress + arrayIndex; the Map additionally provides
 * interfaceId. If both fire in the same batch (typical), the second
 * merges into the existing entity, filling in any missing fields.
 *
 * In-batch merge is preserved in the handler logic. Cross-batch merge uses
 * persist hints so the pipeline preserves non-null values in the specified
 * mergeFields when upserting.
 *
 * assetAddress is enriched for DigitalAsset verification so the optional
 * `receivedAsset` FK can be populated when the asset is a verified DA.
 *
 * Invalid Item entries (dataValue not a valid 20-byte address) are skipped
 * entirely — no garbage entities to clean up later.
 *
 * Port from v1:
 *   - plugins/datakeys/lsp5ReceivedAssets.plugin.ts (extract + populate + persist)
 *   - utils/dataChanged/lsp5ReceivedAssetsLength.ts
 *   - utils/dataChanged/lsp5ReceivedAssetsItem.ts
 *   - utils/dataChanged/lsp5ReceivedAssetsMap.ts
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { DataChanged, LSP5ReceivedAsset, LSP5ReceivedAssetsLength } from '@chillwhales/typeorm';
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP5ReceivedAssetsLength';
const RECEIVED_ASSET_TYPE = 'LSP5ReceivedAsset';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP5_RECEIVED_ASSETS_LENGTH_KEY: string = LSP5DataKeys['LSP5ReceivedAssets[]'].length;
const LSP5_RECEIVED_ASSETS_INDEX_PREFIX: string = LSP5DataKeys['LSP5ReceivedAssets[]'].index;
const LSP5_RECEIVED_ASSETS_MAP_PREFIX: string = LSP5DataKeys.LSP5ReceivedAssetsMap;

const LSP5ReceivedAssetsHandler: EntityHandler = {
  name: 'lsp5ReceivedAssets',
  listensToBag: ['DataChanged'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    // Set persist hint for cross-batch merge behavior
    hctx.batchCtx.setPersistHint(RECEIVED_ASSET_TYPE, {
      entityClass: LSP5ReceivedAsset,
      mergeFields: ['arrayIndex', 'interfaceId', 'receivedAsset'],
    });

    for (const event of events.values()) {
      const { dataKey, dataValue, address, timestamp } = event;

      if (dataKey === LSP5_RECEIVED_ASSETS_LENGTH_KEY) {
        extractLength(address, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP5_RECEIVED_ASSETS_INDEX_PREFIX)) {
        extractFromIndex(address, dataKey, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP5_RECEIVED_ASSETS_MAP_PREFIX)) {
        extractFromMap(address, dataKey, dataValue, timestamp, hctx);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Extract helpers
// ---------------------------------------------------------------------------

/**
 * Extract LSP5ReceivedAssetsLength.
 *
 * dataValue should be 16 bytes (uint128). If not, value is stored as null.
 * Deterministic id = address (one length entity per universal profile).
 */
function extractLength(
  address: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const entity = new LSP5ReceivedAssetsLength({
    id: address,
    address,
    timestamp,
    value: isHex(dataValue) && hexToBytes(dataValue).length === 16 ? hexToBigInt(dataValue) : null,
    rawValue: dataValue,
    universalProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(LENGTH_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: LENGTH_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });
}

/**
 * Extract received asset from an LSP5ReceivedAssets[] index (Item) event.
 *
 * assetAddress: decoded from dataValue (must be exactly 20 bytes).
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * If dataValue is not a valid 20-byte address, the event is skipped
 * (no garbage entity — the Map event will provide the data).
 *
 * Merges into existing LSP5ReceivedAsset entity if one was already created
 * by a Map event in the same batch.
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue).length !== 20) return;

  const assetAddress = dataValue;
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = `${address} - ${assetAddress}`;

  // Check if a Map event already created this entity in the same batch
  const existing = hctx.batchCtx.getEntities<LSP5ReceivedAsset>(RECEIVED_ASSET_TYPE).get(id);
  if (existing) {
    // Merge: fill in arrayIndex if not already set
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = timestamp;
    return;
  }

  const entity = new LSP5ReceivedAsset({
    id,
    address,
    timestamp,
    assetAddress,
    arrayIndex,
    universalProfile: null, // FK initially null
    receivedAsset: null, // FK initially null
  });

  hctx.batchCtx.addEntity(RECEIVED_ASSET_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK (primary entity type)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: RECEIVED_ASSET_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });

  // Queue enrichment for receivedAsset FK (secondary DA reference)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.DigitalAsset,
    address: assetAddress,
    entityType: RECEIVED_ASSET_TYPE,
    entityId: entity.id,
    fkField: 'receivedAsset',
  });
}

/**
 * Extract received asset from an LSP5ReceivedAssetsMap event.
 *
 * assetAddress: last 20 bytes of dataKey (bytes 12..32).
 * interfaceId: first 4 bytes of dataValue (if value is 20 bytes).
 * arrayIndex: bytes 4..20 of dataValue (if value is 20 bytes).
 *
 * Merges into existing LSP5ReceivedAsset entity if one was already created
 * by an Index event in the same batch.
 */
function extractFromMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const assetAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const interfaceId = isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null;
  const arrayIndex = isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null;
  const id = `${address} - ${assetAddress}`;

  // Check if an Index event already created this entity in the same batch
  const existing = hctx.batchCtx.getEntities<LSP5ReceivedAsset>(RECEIVED_ASSET_TYPE).get(id);
  if (existing) {
    // Merge: Map provides interfaceId + potentially better arrayIndex
    existing.interfaceId = interfaceId ?? existing.interfaceId;
    existing.arrayIndex = arrayIndex ?? existing.arrayIndex;
    existing.timestamp = timestamp;
    return;
  }

  const entity = new LSP5ReceivedAsset({
    id,
    address,
    timestamp,
    assetAddress,
    arrayIndex,
    interfaceId,
    universalProfile: null, // FK initially null
    receivedAsset: null, // FK initially null
  });

  hctx.batchCtx.addEntity(RECEIVED_ASSET_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK (primary entity type)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: RECEIVED_ASSET_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });

  // Queue enrichment for receivedAsset FK (secondary DA reference)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.DigitalAsset,
    address: assetAddress,
    entityType: RECEIVED_ASSET_TYPE,
    entityId: entity.id,
    fkField: 'receivedAsset',
  });
}

export default LSP5ReceivedAssetsHandler;
