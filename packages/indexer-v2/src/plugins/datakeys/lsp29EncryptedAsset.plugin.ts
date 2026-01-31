/**
 * LSP29EncryptedAsset data key plugin.
 *
 * Handles four related `LSP29EncryptedAsset` data key patterns emitted via
 * `DataChanged(bytes32,bytes)` on Universal Profiles:
 *
 *   1. **LSP29EncryptedAssets[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of encrypted assets.
 *      Entity: `LSP29EncryptedAssetsLength` (deterministic id = address).
 *
 *   2. **LSP29EncryptedAssets[] index** — prefix match on `0x1965f98377ddff08e78c93d820cc8de4`.
 *      Decodes a VerifiableURI from the data value and the array index
 *      from the last 16 bytes of the data key.
 *      Entity: `LSP29EncryptedAsset` (id = `"{address} - {dataKey}"`).
 *      This is the main metadata entity with URL + fetch tracking fields.
 *
 *   3. **LSP29EncryptedAssetsMap** — prefix match on `0x2b9a7a38a67cedc507c2`.
 *      Decodes the content ID hash from the last 20 bytes of the data key,
 *      plus the array index (uint128) from the data value.
 *      Entity: `LSP29EncryptedAssetEntry` (id = `"{address} - {contentIdHash}"`).
 *
 *   4. **LSP29EncryptedAssetRevisionCount** — prefix match on `0xb41f63e335c22bded814`.
 *      Decodes the content ID hash from the last 20 bytes of the data key,
 *      plus the revision count (uint128) from the data value.
 *      Entity: `LSP29EncryptedAssetRevisionCount` (id = `"{address} - {contentIdHash}"`).
 *
 * The main `LSP29EncryptedAsset` entity stores a VerifiableURI and tracks
 * fetch state (`isDataFetched`, `retryCount`, etc.) for the metadata fetch
 * handler (Phase 5, issue #55). Sub-entities (title, description, images,
 * encryption, chunks, etc.) are created by the handler, not by this plugin.
 *
 * `clearSubEntities()` removes existing sub-entities before the handler
 * re-creates them from freshly fetched metadata (delete-then-reinsert pattern).
 *
 * Port from v1:
 *   - utils/dataChanged/lsp29EncryptedAssetsLength.ts
 *   - utils/dataChanged/lsp29EncryptedAssetsItem.ts
 *   - utils/dataChanged/lsp29EncryptedAssetsMap.ts
 *   - utils/dataChanged/lsp29EncryptedAssetRevisionCount.ts
 *   - utils/dataChanged/lsp29EncryptedAsset.ts (clearSubEntities)
 *   - app/scanner.ts (DataChanged case → LSP29 routing)
 *   - app/index.ts (upsert + clearSubEntities)
 */
import {
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetEntry,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetsLength,
  LSP29EncryptedAssetTitle,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

import { LSP29DataKeys } from '@/constants/lsp29';
import { upsertEntities } from '@/core/persistHelpers';
import { populateByUP } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeVerifiableUri } from '@/utils';

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

const LSP29EncryptedAssetPlugin: DataKeyPlugin = {
  name: 'lsp29EncryptedAsset',
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return (
      dataKey === LSP29_LENGTH_KEY ||
      dataKey.startsWith(LSP29_INDEX_PREFIX) ||
      dataKey.startsWith(LSP29_MAP_PREFIX) ||
      dataKey.startsWith(LSP29_REVISION_COUNT_PREFIX)
    );
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    if (dataKey === LSP29_LENGTH_KEY) {
      extractLength(address, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP29_INDEX_PREFIX)) {
      extractFromIndex(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP29_MAP_PREFIX)) {
      extractFromMap(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP29_REVISION_COUNT_PREFIX)) {
      extractRevisionCount(address, dataKey, dataValue, timestamp, ctx);
    }

    // UP address tracking is handled by the DataChanged meta-plugin (parent).
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByUP<LSP29EncryptedAssetsLength>(ctx, LENGTH_TYPE);
    populateByUP<LSP29EncryptedAsset>(ctx, ENCRYPTED_ASSET_TYPE);
    populateByUP<LSP29EncryptedAssetEntry>(ctx, ENTRY_TYPE);
    populateByUP<LSP29EncryptedAssetRevisionCount>(ctx, REVISION_COUNT_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4a: CLEAR SUB-ENTITIES
  // Delete-then-reinsert pattern: remove existing sub-entities before the
  // handler (Phase 5) re-creates them from freshly fetched metadata.
  // ---------------------------------------------------------------------------

  async clearSubEntities(store: Store, ctx: IBatchContext): Promise<void> {
    const entities = ctx.getEntities<LSP29EncryptedAsset>(ENCRYPTED_ASSET_TYPE);
    if (entities.size === 0) return;

    const ids = [...entities.keys()];
    const filter = { lsp29EncryptedAsset: { id: In(ids) } };

    // Find all existing sub-entities for these LSP29EncryptedAssets
    const [titles, descriptions, files, encryptions, chunks, images] = await Promise.all([
      store.findBy(LSP29EncryptedAssetTitle, filter),
      store.findBy(LSP29EncryptedAssetDescription, filter),
      store.findBy(LSP29EncryptedAssetFile, filter),
      store.findBy(LSP29EncryptedAssetEncryption, filter),
      store.findBy(LSP29EncryptedAssetChunks, filter),
      store.findBy(LSP29EncryptedAssetImage, filter),
    ]);

    // Clear access control conditions for existing encryptions (nested sub-entity)
    if (encryptions.length > 0) {
      const encryptionFilter = {
        encryption: { id: In(encryptions.map(({ id }) => id)) },
      };
      const conditions = await store.findBy(LSP29AccessControlCondition, encryptionFilter);
      await store.remove(conditions);
    }

    // Remove all found sub-entities
    await Promise.all([
      store.remove(titles),
      store.remove(descriptions),
      store.remove(files),
      store.remove(encryptions),
      store.remove(chunks),
      store.remove(images),
    ]);
  },

  // ---------------------------------------------------------------------------
  // Phase 4b: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await Promise.all([
      upsertEntities(store, ctx, LENGTH_TYPE),
      upsertEntities(store, ctx, ENCRYPTED_ASSET_TYPE),
      upsertEntities(store, ctx, ENTRY_TYPE),
      upsertEntities(store, ctx, REVISION_COUNT_TYPE),
    ]);
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
  timestamp: number,
  ctx: IBatchContext,
): void {
  const entity = new LSP29EncryptedAssetsLength({
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
  timestamp: number,
  ctx: IBatchContext,
): void {
  const { value: url, decodeError } = decodeVerifiableUri(dataValue);

  const dataKeyBytes = hexToBytes(dataKey as Hex);
  const arrayIndex = dataKeyBytes.length >= 32 ? bytesToBigInt(dataKeyBytes.slice(16)) : null;

  const entity = new LSP29EncryptedAsset({
    id: `${address} - ${dataKey}`,
    address,
    timestamp: new Date(timestamp),
    arrayIndex,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    retryCount: 0,
  });

  ctx.addEntity(ENCRYPTED_ASSET_TYPE, entity.id, entity);
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
  timestamp: number,
  ctx: IBatchContext,
): void {
  const contentIdHash = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue as Hex) : new Uint8Array(0);
  const arrayIndex = dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  const entity = new LSP29EncryptedAssetEntry({
    id: `${address} - ${contentIdHash}`,
    address,
    timestamp: new Date(timestamp),
    contentIdHash,
    arrayIndex,
  });

  ctx.addEntity(ENTRY_TYPE, entity.id, entity);
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
  timestamp: number,
  ctx: IBatchContext,
): void {
  const contentIdHash = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const dataValueBytes = isHex(dataValue) ? hexToBytes(dataValue as Hex) : new Uint8Array(0);
  const revisionCount = dataValueBytes.length === 16 ? bytesToBigInt(dataValueBytes) : null;

  const entity = new LSP29EncryptedAssetRevisionCount({
    id: `${address} - ${contentIdHash}`,
    address,
    timestamp: new Date(timestamp),
    contentIdHash,
    revisionCount,
    rawValue: dataValue,
  });

  ctx.addEntity(REVISION_COUNT_TYPE, entity.id, entity);
}

export default LSP29EncryptedAssetPlugin;
