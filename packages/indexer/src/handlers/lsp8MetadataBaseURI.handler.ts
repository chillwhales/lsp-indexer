/**
 * LSP8TokenMetadataBaseURI entity handler.
 *
 * Subscribes to DataChanged events and creates LSP8TokenMetadataBaseURI entities
 * for events matching the LSP8TokenMetadataBaseURI data key. Decodes the base URI
 * used for per-token metadata resolution on LSP8 identifiable assets.
 *
 * The data value uses a VerifiableURI-like encoding:
 *   - First 8 bytes: verification header (either zero-padded or keccak256(bytes) method)
 *   - Remaining bytes: UTF-8 encoded base URI string
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { DataChanged, LSP8TokenMetadataBaseURI } from '@chillwhales/typeorm';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { concat, hexToString, isHex, keccak256, sliceHex, toHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8TokenMetadataBaseURI';

const LSP8_METADATA_BASE_URI_KEY: string = LSP8DataKeys.LSP8TokenMetadataBaseURI;

// ---------------------------------------------------------------------------
// VerifiableURI header validation constants
// ---------------------------------------------------------------------------

/** Zero-padded 8-byte header (no verification method) */
const ZERO_HEADER = toHex(0, { size: 8 });

/** keccak256(bytes) verification method header:
 *  2 bytes zero + 4 bytes keccak256("keccak256(bytes)") selector + 2 bytes zero */
const KECCAK_HEADER = concat([
  toHex(0, { size: 2 }),
  sliceHex(keccak256(toHex('keccak256(bytes)')), 0, 4),
  toHex(0, { size: 2 }),
]);

const LSP8MetadataBaseURIHandler: EntityHandler = {
  name: 'lsp8MetadataBaseURI',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP8_METADATA_BASE_URI_KEY) continue;

      // Create entity with decoded base URI
      const entity = new LSP8TokenMetadataBaseURI({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        value: decodeBaseURI(event.dataValue),
        rawValue: event.dataValue,
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<LSP8TokenMetadataBaseURI>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'digitalAsset',
        blockNumber: 0,
        transactionIndex: 0,
        logIndex: 0,
      });
    }
  },
};

// ---------------------------------------------------------------------------
// Decode helper
// ---------------------------------------------------------------------------

/**
 * Decode the VerifiableURI-encoded base URI from the data value.
 *
 * Valid encodings have an 8-byte header (either zero-padded or keccak256 method)
 * followed by a UTF-8 string. Returns null for empty, non-hex, or unrecognized
 * header formats.
 */
function decodeBaseURI(dataValue: string): string | null {
  if (!isHex(dataValue) || dataValue === '0x') return null;

  // Validate header format
  if (!dataValue.startsWith(ZERO_HEADER) && !dataValue.startsWith(KECCAK_HEADER)) return null;

  // Extract UTF-8 string after the 8-byte header
  const uri = hexToString(sliceHex(dataValue, 8));
  return uri || null;
}

export default LSP8MetadataBaseURIHandler;
