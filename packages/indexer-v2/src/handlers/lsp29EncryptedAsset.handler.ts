/**
 * LSP29EncryptedAsset entity handler.
 *
 * Subscribes to DataChanged events and creates four types of LSP29-related
 * entities from different data key patterns:
 *
 *   1. **LSP29EncryptedAssets[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of encrypted assets.
 *      Entity: `LSP29EncryptedAssetsLength` (deterministic id = address).
 *
 *   2. **LSP29EncryptedAssets[] index** — prefix match on the index prefix.
 *      Decodes a VerifiableURI from the data value and the array index
 *      from the last 16 bytes of the data key.
 *      Entity: `LSP29EncryptedAsset` (id = `"{address} - {dataKey}"`).
 *      This is the main metadata entity with URL + fetch tracking fields.
 *
 *   3. **LSP29EncryptedAssetsMap** — prefix match on the map prefix.
 *      Decodes the content ID hash from the last 20 bytes of the data key,
 *      plus the array index (uint128) from the data value.
 *      Entity: `LSP29EncryptedAssetEntry` (id = `"{address} - {contentIdHash}"`).
 *
 *   4. **LSP29EncryptedAssetRevisionCount** — prefix match on the revision count prefix.
 *      Decodes the content ID hash from the last 20 bytes of the data key,
 *      plus the revision count (uint128) from the data value.
 *      Entity: `LSP29EncryptedAssetRevisionCount` (id = `"{address} - {contentIdHash}"`).
 *
 * The metadata fetch handler (issue #55) will later fetch the URL and populate
 * sub-entities (title, description, images, encryption, etc.). This handler only
 * creates the main entities with `isDataFetched: false`.
 *
 * Note: clearSubEntities logic is deferred to the metadata fetch handler since
 * that handler re-creates the sub-entities.
 *
 * Port from v1:
 *   - plugins/datakeys/lsp29EncryptedAsset.plugin.ts (extract + populate + persist)
 *   - utils/dataChanged/lsp29EncryptedAssetsLength.ts
 *   - utils/dataChanged/lsp29EncryptedAssetsItem.ts
 *   - utils/dataChanged/lsp29EncryptedAssetsMap.ts
 *   - utils/dataChanged/lsp29EncryptedAssetRevisionCount.ts
 */
import { LSP29DataKeys } from '@/constants/lsp29';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { decodeVerifiableUri } from '@/utils';
import {
  DataChanged,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetEntry,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetsLength,
} from '@chillwhales/typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP29EncryptedAssetsLength';
const ENCRYPTED_ASSET_TYPE = 'LSP29EncryptedAsset';
const ENTRY_TYPE = 'LSP29EncryptedAssetEntry';
const REVISION_COUNT_TYPE = 'LSP29EncryptedAssetRevisionCount';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP29_LENGTH_KEY: string = LSP29DataKeys['LSP29EncryptedAssets[]'].length;
const LSP29_INDEX_PREFIX: string = LSP29DataKeys['LSP29EncryptedAssets[]'].index;
const LSP29_MAP_PREFIX: string = LSP29DataKeys.LSP29EncryptedAssetsMap;
const LSP29_REVISION_COUNT_PREFIX: string = LSP29DataKeys.LSP29EncryptedAssetRevisionCount;

const LSP29EncryptedAssetHandler: EntityHandler = {
  name: 'lsp29EncryptedAsset',
  listensToBag: ['DataChanged'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    for (const event of events.values()) {
      const { dataKey, dataValue, address, timestamp } = event;

      if (dataKey === LSP29_LENGTH_KEY) {
        extractLength(address, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP29_INDEX_PREFIX)) {
        extractFromIndex(address, dataKey, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP29_MAP_PREFIX)) {
        extractFromMap(address, dataKey, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP29_REVISION_COUNT_PREFIX)) {
        extractRevisionCount(address, dataKey, dataValue, timestamp, hctx);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Extract helpers
// ---------------------------------------------------------------------------

/**
 * Extract LSP29EncryptedAssetsLength.
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
  const entity = new LSP29EncryptedAssetsLength({
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
 * Extract main encrypted asset entity from an LSP29EncryptedAssets[] index event.
 *
 * The data value is a VerifiableURI encoding the metadata URL.
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * Entity id: `"{address} - {dataKey}"` — one per array slot.
 * The metadata fetch handler (Phase 5) will later fetch the URL and populate
 * sub-entities (title, description, images, encryption, etc.).
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const { value: url, decodeError } = decodeVerifiableUri(dataValue);

  const dataKeyBytes = hexToBytes(dataKey as Hex);
  const arrayIndex = dataKeyBytes.length >= 32 ? bytesToBigInt(dataKeyBytes.slice(16)) : null;

  const entity = new LSP29EncryptedAsset({
    id: `${address} - ${dataKey}`,
    address,
    timestamp,
    arrayIndex,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    retryCount: 0,
    universalProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(ENCRYPTED_ASSET_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: ENCRYPTED_ASSET_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });
}

/**
 * Extract encrypted asset entry from an LSP29EncryptedAssetsMap event.
 *
 * contentIdHash: last 20 bytes of dataKey (bytes 12..32).
 * arrayIndex: uint128 from dataValue (if exactly 16 bytes).
 *
 * Entity id: `"{address} - {contentIdHash}"` — one per content ID per UP.
 */
function extractFromMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const contentIdHash = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue) : new Uint8Array(0);
  const arrayIndex = dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  const entity = new LSP29EncryptedAssetEntry({
    id: `${address} - ${contentIdHash}`,
    address,
    timestamp,
    contentIdHash,
    arrayIndex,
    universalProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(ENTRY_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: ENTRY_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });
}

/**
 * Extract revision count from an LSP29EncryptedAssetRevisionCount event.
 *
 * contentIdHash: last 20 bytes of dataKey (bytes 12..32).
 * revisionCount: uint128 from dataValue (if exactly 16 bytes).
 *
 * Entity id: `"{address} - {contentIdHash}"` — one per content ID per UP.
 */
function extractRevisionCount(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const contentIdHash = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue) : new Uint8Array(0);
  const revisionCount = dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  const entity = new LSP29EncryptedAssetRevisionCount({
    id: `${address} - ${contentIdHash}`,
    address,
    timestamp,
    contentIdHash,
    revisionCount,
    rawValue: dataValue,
    universalProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(REVISION_COUNT_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: REVISION_COUNT_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
  });
}

export default LSP29EncryptedAssetHandler;
