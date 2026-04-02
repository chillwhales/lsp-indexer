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
 */
import { resolveEntities } from '@/core/handlerHelpers';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { prefixId } from '@/utils';
import { DataChanged, LSP4Creator, LSP4CreatorsLength } from '@/model';
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
  supportedChains: ['lukso', 'ethereum', 'ethereum-sepolia'],
  listensToBag: ['DataChanged'],

  async handle(hctx, _triggeredBy): Promise<void> {
    const events = hctx.batchCtx.getEntities('DataChanged');

    // Set persist hint for cross-batch merge behavior (safety net)
    hctx.batchCtx.setPersistHint<LSP4Creator>(CREATOR_TYPE, {
      entityClass: LSP4Creator,
      mergeFields: ['arrayIndex', 'interfaceId'],
    });

    // Collect all potential entity IDs from Index and Map events
    const potentialIds: string[] = [];
    for (const event of events.values()) {
      const { dataKey, dataValue, address } = event;

      if (dataKey.startsWith(LSP4_CREATORS_INDEX_PREFIX)) {
        if (isHex(dataValue) && hexToBytes(dataValue).length === 20) {
          const creatorAddress = dataValue;
          potentialIds.push(`${address} - ${creatorAddress}`);
        }
      } else if (dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)) {
        const creatorAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
        potentialIds.push(`${address} - ${creatorAddress}`);
      }
    }

    // Merge entities from BOTH BatchContext and database
    const existingCreators = await resolveEntities(
      hctx.store,
      hctx.batchCtx,
      CREATOR_TYPE,
      potentialIds,
    );

    for (const event of events.values()) {
      const { dataKey, dataValue, address, timestamp } = event;

      if (dataKey === LSP4_CREATORS_LENGTH_KEY) {
        extractLength(address, dataValue, timestamp, event, hctx);
      } else if (dataKey.startsWith(LSP4_CREATORS_INDEX_PREFIX)) {
        extractFromIndex(address, dataKey, dataValue, timestamp, event, hctx, existingCreators);
      } else if (dataKey.startsWith(LSP4_CREATORS_MAP_PREFIX)) {
        extractFromMap(address, dataKey, dataValue, timestamp, event, hctx, existingCreators);
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
  event: DataChanged,
  hctx: HandlerContext,
): void {
  const entity = new LSP4CreatorsLength({
    id: prefixId(hctx.batchCtx.network, address),
    network: hctx.batchCtx.network,
    address,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    value: isHex(dataValue) && hexToBytes(dataValue).length === 16 ? hexToBigInt(dataValue) : null,
    rawValue: dataValue,
    digitalAsset: null, // FK initially null
  });

  hctx.batchCtx.addEntity(LENGTH_TYPE, entity.id, entity);

  // Queue enrichment for digitalAsset FK
  hctx.batchCtx.queueEnrichment<LSP4CreatorsLength>({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: LENGTH_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    timestamp: event.timestamp.getTime(),
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
 * Merges into existing LSP4Creator entity if one exists in EITHER
 * the current batch OR the database.
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingCreators: Map<string, LSP4Creator>,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue).length !== 20) return;

  const creatorAddress = dataValue;
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = prefixId(hctx.batchCtx.network, `${address} - ${creatorAddress}`);

  // Check if entity exists in EITHER batch OR database
  const existing = existingCreators.get(id);
  if (existing) {
    // Merge: fill in arrayIndex if not already set
    const updated = new LSP4Creator({
      ...existing,
      arrayIndex: existing.arrayIndex ?? arrayIndex,
      timestamp,
    });
    hctx.batchCtx.addEntity(CREATOR_TYPE, updated.id, updated);
    existingCreators.set(id, updated);
    return;
  }

  const entity = new LSP4Creator({
    id,
    network: hctx.batchCtx.network,
    address,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    creatorAddress,
    arrayIndex,
    digitalAsset: null, // FK initially null
    creatorProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(CREATOR_TYPE, entity.id, entity);
  existingCreators.set(id, entity); // Add to map for subsequent events

  // Queue enrichment for digitalAsset FK (primary entity type)
  hctx.batchCtx.queueEnrichment<LSP4Creator>({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    timestamp: event.timestamp.getTime(),
  });

  // Queue enrichment for creatorProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment<LSP4Creator>({
    category: EntityCategory.UniversalProfile,
    address: creatorAddress,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'creatorProfile',
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    timestamp: event.timestamp.getTime(),
  });
}

/**
 * Extract creator from an LSP4CreatorsMap event.
 *
 * creatorAddress: last 20 bytes of dataKey (bytes 12..32).
 * interfaceId: first 4 bytes of dataValue (if value is 20 bytes).
 * arrayIndex: bytes 4..20 of dataValue (if value is 20 bytes).
 *
 * Merges into existing LSP4Creator entity if one exists in EITHER
 * the current batch OR the database.
 */
function extractFromMap(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingCreators: Map<string, LSP4Creator>,
): void {
  const creatorAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue) : new Uint8Array(0);
  const isValidValue = dataValueBytes.length === 20;

  const interfaceId = isValidValue ? bytesToHex(dataValueBytes.slice(0, 4)) : null;
  const arrayIndex = isValidValue ? bytesToBigInt(dataValueBytes.slice(4)) : null;
  const id = prefixId(hctx.batchCtx.network, `${address} - ${creatorAddress}`);

  // Check if entity exists in EITHER batch OR database
  const existing = existingCreators.get(id);
  if (existing) {
    // Merge: Map provides interfaceId + potentially better arrayIndex
    const updated = new LSP4Creator({
      ...existing,
      interfaceId: interfaceId ?? existing.interfaceId,
      arrayIndex: arrayIndex ?? existing.arrayIndex,
      timestamp,
    });
    hctx.batchCtx.addEntity(CREATOR_TYPE, updated.id, updated);
    existingCreators.set(id, updated);
    return;
  }

  const entity = new LSP4Creator({
    id,
    network: hctx.batchCtx.network,
    address,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    creatorAddress,
    arrayIndex,
    interfaceId,
    digitalAsset: null, // FK initially null
    creatorProfile: null, // FK initially null
  });

  hctx.batchCtx.addEntity(CREATOR_TYPE, entity.id, entity);
  existingCreators.set(id, entity); // Add to map for subsequent events

  // Queue enrichment for digitalAsset FK (primary entity type)
  hctx.batchCtx.queueEnrichment<LSP4Creator>({
    category: EntityCategory.DigitalAsset,
    address,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'digitalAsset',
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    timestamp: event.timestamp.getTime(),
  });

  // Queue enrichment for creatorProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment<LSP4Creator>({
    category: EntityCategory.UniversalProfile,
    address: creatorAddress,
    entityType: CREATOR_TYPE,
    entityId: entity.id,
    fkField: 'creatorProfile',
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    timestamp: event.timestamp.getTime(),
  });
}

export default LSP4CreatorsHandler;
