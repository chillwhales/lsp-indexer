/**
 * LSP8TokenMetadataBaseURI data key plugin.
 *
 * Handles the `LSP8TokenMetadataBaseURI` data key emitted via
 * `DataChanged(bytes32,bytes)` on Digital Assets. Decodes the base URI
 * used for per-token metadata resolution on LSP8 identifiable assets.
 *
 * The data value uses a VerifiableURI-like encoding:
 *   - First 8 bytes: verification header (either zero-padded or keccak256(bytes) method)
 *   - Remaining bytes: UTF-8 encoded base URI string
 *
 * Port from v1:
 *   - utils/dataChanged/lsp8TokenMetadataBaseUri.ts
 *   - app/index.ts L460 (upsert)
 */
import { LSP8DataKeys } from '@lukso/lsp8-contracts';

import { LSP8TokenMetadataBaseURI } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { concat, hexToString, isHex, keccak256, sliceHex, toHex } from 'viem';

import { populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

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

const LSP8MetadataBaseURIPlugin: DataKeyPlugin = {
  name: 'lsp8MetadataBaseURI',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP8_METADATA_BASE_URI_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    const entity = new LSP8TokenMetadataBaseURI({
      id: address,
      address,
      timestamp: new Date(timestamp),
      value: decodeBaseURI(dataValue),
      rawValue: dataValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP8TokenMetadataBaseURI>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ENTITY_TYPE);
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

export default LSP8MetadataBaseURIPlugin;
