/**
 * LSP4Creators entity handler.
 *
 * Subscribes to DataChanged events and creates two types of entities from
 * three related LSP4Creators data key patterns:
 *
 *   1. **LSP4Creators[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of creators.
 *      Entity: `LSP4CreatorsLength` (deterministic id = address).
 *
 *   2. **LSP4Creators[] index** — prefix match on the index prefix.
 *      Decodes a creator address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *
 *   3. **LSP4CreatorsMap** — prefix match on the map prefix.
 *      Decodes the creator address from the data key (last 20 bytes),
 *      plus interface ID and index from the data value.
 *
 * Index and Map events both create/update the same merged `LSP4Creator`
 * entity keyed by `"{daAddress} - {creatorAddress}"`. Both event sources
 * provide creatorAddress + arrayIndex; the Map additionally provides
 * interfaceId. If both fire in the same batch (typical), the second
 * merges into the existing entity, filling in any missing fields.
 *
 * In-batch merge is preserved in the handler logic. Cross-batch merge uses
 * persist hints so the pipeline preserves non-null values in the specified
 * mergeFields when upserting.
 *
 * creatorAddress is enriched for UniversalProfile verification so the
 * optional `creatorProfile` FK can be populated when the creator is a UP.
 *
 * Invalid Item entries (dataValue not a valid 20-byte address) are skipped
 * entirely — no garbage entities to clean up later.
 *
 * Port from v1:
 *   - plugins/datakeys/lsp4Creators.plugin.ts (extract + populate + persist)
 *   - utils/dataChanged/lsp4CreatorsLength.ts
 *   - utils/dataChanged/lsp4CreatorsItem.ts
 *   - utils/dataChanged/lsp4CreatorsMap.ts
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { DataChanged, LSP4Creator, LSP4CreatorsLength } from '@chillwhales/typeorm';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

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

const LSP4CreatorsHandler: EntityHandler = {
  name: 'lsp4Creators',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    // Set persist hint for cross-batch merge behavior
    hctx.batchCtx.setPersistHint(CREATOR_TYPE, {
      entityClass: LSP4Creator,
      mergeFields: ['arrayIndex', 'interfaceId', 'creatorProfile'],
    });

    for (const event of events.values()) {
      const { dataKey, dataValue, address, timestamp } = event;

      if (dataKey === LSP4_CREATORS_LENGTH_KEY) {
        extractLength(address, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP4_CREATORS_INDEX_PREFIX)) {
        extractFromIndex(address, dataKey, dataValue, timestamp, hctx);
      } else if (dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)) {
        extractFromMap(address, dataKey, dataValue, timestamp, hctx);
      }
    }
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
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const entity = new LSP4CreatorsLength({
    id: address,
    address,
    timestamp,
    value: isHex(dataValue) && hexToBytes(dataValue).length === 16 ? hexToBigInt(dataValue) : null,
    rawValue: dataValue,
    digitalAsset: null, // FK initially null
  });

  hctx.batchCtx.addEntity(LENGTH_TYPE, entity.id, entity);

  // Queue enrichment for digitalAsset FK
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: LENGTH_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
  });
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
  timestamp: Date,
  hctx: HandlerContext,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue).length !== 20) return;

  const creatorAddress = dataValue;
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = `${address} - ${creatorAddress}`;

  // Check if a Map event already created this entity in the same batch
  const existing = hctx.batchCtx.getEntities<LSP4Creator>(CREATOR_TYPE).get(id);
  if (existing) {
    // Merge: fill in arrayIndex if not already set
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = timestamp;
    return;
  }

  const entity = new LSP4Creator({
    id,
    address,
    timestamp,
    creatorAddress,
    arrayIndex,
    digitalAsset: null, // FK initially null
    creatorProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(CREATOR_TYPE, entity.id, entity);

  // Queue enrichment for digitalAsset FK (primary entity type)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
  });

  // Queue enrichment for creatorProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address: creatorAddress,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'creatorProfile',
  });
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
  timestamp: Date,
  hctx: HandlerContext,
): void {
  const creatorAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const interfaceId = isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null;
  const arrayIndex = isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null;
  const id = `${address} - ${creatorAddress}`;

  // Check if an Index event already created this entity in the same batch
  const existing = hctx.batchCtx.getEntities<LSP4Creator>(CREATOR_TYPE).get(id);
  if (existing) {
    // Merge: Map provides interfaceId + potentially better arrayIndex
    existing.interfaceId = interfaceId ?? existing.interfaceId;
    existing.arrayIndex = arrayIndex ?? existing.arrayIndex;
    existing.timestamp = timestamp;
    return;
  }

  const entity = new LSP4Creator({
    id,
    address,
    timestamp,
    creatorAddress,
    arrayIndex,
    interfaceId,
    digitalAsset: null, // FK initially null
    creatorProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(CREATOR_TYPE, entity.id, entity);

  // Queue enrichment for digitalAsset FK (primary entity type)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
  });

  // Queue enrichment for creatorProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment({
    category: EntityCategory.UniversalProfile,
    address: creatorAddress,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'creatorProfile',
  });
}

export default LSP4CreatorsHandler;
