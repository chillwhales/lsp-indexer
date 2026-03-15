import type {
  EncryptedAsset,
  EncryptedAssetChunks,
  EncryptedAssetEncryption,
  EncryptedAssetFile,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
} from '@lsp-indexer/types';
import type { GetEncryptedAssetsQuery } from '../graphql/graphql';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { parseImages } from './utils';

/** Raw Hasura row type from codegen — provides compile-time field name safety. */
type RawEncryptedAsset = GetEncryptedAssetsQuery['lsp29_encrypted_asset'][number];
type RawEncryption = NonNullable<RawEncryptedAsset['encryption']>;
type RawFile = NonNullable<RawEncryptedAsset['file']>;
type RawChunks = NonNullable<RawEncryptedAsset['chunks']>;

// ---------------------------------------------------------------------------
// Sub-object parsers — helpers for each nested type
// ---------------------------------------------------------------------------

/**
 * Parse a raw Hasura `lsp29_encrypted_asset_encryption` into a clean `EncryptedAssetEncryption`.
 *
 * Maps snake_case fields to camelCase. Method-specific params are flattened
 * directly on the encryption object (no separate params relation).
 * Sub-field presence is controlled by `@include` directives in the GraphQL
 * document — excluded fields are simply absent from `raw`, so `?? null` handles them.
 */
function parseEncryption(raw: RawEncryption): EncryptedAssetEncryption {
  return {
    provider: raw.provider ?? null,
    method: raw.method ?? null,
    condition: raw.condition ?? null,
    encryptedKey: raw.encrypted_key ?? null,
    tokenAddress: raw.token_address ?? null,
    requiredBalance: raw.required_balance ?? null,
    requiredTokenId: raw.required_token_id ?? null,
    followedAddresses: raw.followed_addresses ?? null,
    unlockTimestamp: raw.unlock_timestamp ?? null,
  };
}

/**
 * Parse a raw Hasura `lsp29_encrypted_asset_file` into a clean `EncryptedAssetFile`.
 *
 * Converts Hasura `numeric` fields to JavaScript numbers:
 * - `last_modified` (numeric) → `lastModified` (number | null)
 * - `size` (numeric) → `size` (number | null)
 *
 * Sub-field presence is controlled by `@include` directives in the GraphQL
 * document — excluded fields are absent from `raw`, so `?? null` handles them.
 */
function parseFile(raw: RawFile): EncryptedAssetFile {
  return {
    hash: raw.hash ?? null,
    lastModified: raw.last_modified != null ? Number(raw.last_modified) : null,
    name: raw.name ?? null,
    size: raw.size != null ? Number(raw.size) : null,
    type: raw.type ?? null,
  };
}

/**
 * Parse a raw Hasura `lsp29_encrypted_asset_chunks` into a clean `EncryptedAssetChunks`.
 *
 * Converts `total_size` (numeric) → `totalSize` (number | null).
 * Maps per-backend chunk fields from snake_case to camelCase.
 *
 * Sub-field presence is controlled by `@include` directives in the GraphQL
 * document — excluded fields are absent from `raw`, so `?? null` handles them.
 */
function parseChunks(raw: RawChunks): EncryptedAssetChunks {
  return {
    iv: raw.iv ?? null,
    totalSize: raw.total_size != null ? Number(raw.total_size) : null,
    ipfsCids: raw.ipfs_cids ?? null,
    lumeraActionIds: raw.lumera_action_ids ?? null,
    arweaveTransactionIds: raw.arweave_transaction_ids ?? null,
    s3Keys: raw.s3_keys ?? null,
    s3Bucket: raw.s3_bucket ?? null,
    s3Region: raw.s3_region ?? null,
  };
}

// ---------------------------------------------------------------------------
// Main parser — parseEncryptedAsset
// ---------------------------------------------------------------------------

/** Parse a raw Hasura row into a clean domain type. */
export function parseEncryptedAsset(raw: RawEncryptedAsset): EncryptedAsset;
export function parseEncryptedAsset<const I extends EncryptedAssetInclude>(
  raw: RawEncryptedAsset,
  include: I,
): EncryptedAssetResult<I>;
export function parseEncryptedAsset(
  raw: RawEncryptedAsset,
  include?: EncryptedAssetInclude,
): EncryptedAsset | PartialEncryptedAsset {
  // Determine if encryption relation is included (boolean true or object form)
  const encInc = include?.encryption;
  const isEncryptionIncluded = encInc === true || (typeof encInc === 'object' && encInc != null);

  const result: EncryptedAsset = {
    // Base fields (always present)
    address: raw.address,
    contentId: raw.content_id ?? null,
    revision: raw.revision ?? null,

    // Includable scalars
    arrayIndex: raw.array_index != null ? Number(raw.array_index) : null,
    timestamp: raw.timestamp ?? null,
    blockNumber: raw.block_number ?? null,
    transactionIndex: raw.transaction_index ?? null,
    logIndex: raw.log_index ?? null,

    // Flattened wrappers — title.value → title, description.value → description
    title: raw.title?.value ?? null,
    description: raw.description?.value ?? null,

    // Nested objects — sub-field presence controlled by @include directives in the
    // GraphQL document; parsers just map what Hasura returns (absent fields → null).
    encryption: isEncryptionIncluded && raw.encryption ? parseEncryption(raw.encryption) : null,
    file: raw.file ? parseFile(raw.file) : null,
    chunks: raw.chunks ? parseChunks(raw.chunks) : null,
    images: parseImages(raw.images),

    // Universal Profile — parsed as full Profile via parseProfile.
    // Sub-include stripping handled by stripExcluded nestedConfig below.
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
  };

  if (include) {
    // Pass sub-include objects through to stripExcluded so it can recursively
    // strip sub-fields. Only normalize universalProfile (handled separately).
    return stripExcluded(
      result,
      include as Record<string, boolean | Record<string, unknown> | undefined>,
      ['address', 'contentId', 'revision'],
      undefined,
      {
        encryption: { baseFields: [] },
        file: { baseFields: ['name'] },
        chunks: { baseFields: [] },
        universalProfile: { baseFields: ['address'] },
      },
    );
  }
  return result;
}

/** Batch variant of parseEncryptedAsset. */
export function parseEncryptedAssets(raw: RawEncryptedAsset[]): EncryptedAsset[];
export function parseEncryptedAssets<const I extends EncryptedAssetInclude>(
  raw: RawEncryptedAsset[],
  include: I,
): EncryptedAssetResult<I>[];
export function parseEncryptedAssets(
  raw: RawEncryptedAsset[],
  include?: EncryptedAssetInclude,
): (EncryptedAsset | PartialEncryptedAsset)[] {
  if (include) return raw.map((r) => parseEncryptedAsset(r, include));
  return raw.map((r) => parseEncryptedAsset(r));
}
