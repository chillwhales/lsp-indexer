import type {
  AccessControlCondition,
  EncryptedAsset,
  EncryptedAssetChunks,
  EncryptedAssetEncryption,
  EncryptedAssetFile,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
} from '@lsp-indexer/types';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { parseImages } from './utils';

// ---------------------------------------------------------------------------
// Sub-object parsers — helpers for each nested type
// ---------------------------------------------------------------------------

/**
 * Parse a raw Hasura `lsp29_access_control_condition` into a clean `AccessControlCondition`.
 *
 * Maps all snake_case fields to camelCase:
 * - `condition_index` → `conditionIndex`
 * - `contract_address` → `contractAddress`
 * - `follower_address` → `followerAddress`
 * - `raw_condition` → `rawCondition`
 * - `standard_contract_type` → `standardContractType`
 * - `token_id` → `tokenId`
 */
function parseAccessControlCondition(raw: any): AccessControlCondition {
  return {
    chain: raw.chain ?? null,
    comparator: raw.comparator ?? null,
    conditionIndex: raw.condition_index, // Int! — always present
    contractAddress: raw.contract_address ?? null,
    followerAddress: raw.follower_address ?? null,
    method: raw.method ?? null,
    rawCondition: raw.raw_condition, // String! — always present
    standardContractType: raw.standard_contract_type ?? null,
    tokenId: raw.token_id ?? null,
    value: raw.value ?? null,
  };
}

/**
 * Parse a raw Hasura `lsp29_encrypted_asset_encryption` into a clean `EncryptedAssetEncryption`.
 *
 * Maps snake_case fields to camelCase. Sub-field presence is controlled by
 * `@include` directives in the GraphQL document — excluded fields are simply
 * absent from `raw`, so `raw.field ?? null` naturally returns `null`.
 */
function parseEncryption(raw: any): EncryptedAssetEncryption {
  return {
    ciphertext: raw.ciphertext ?? null,
    dataToEncryptHash: raw.data_to_encrypt_hash ?? null,
    decryptionCode: raw.decryption_code ?? null,
    decryptionParams: raw.decryption_params ?? null,
    method: raw.method ?? null,
    accessControlConditions: raw.accessControlConditions
      ? raw.accessControlConditions.map(parseAccessControlCondition)
      : null,
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
function parseFile(raw: any): EncryptedAssetFile {
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
 *
 * Sub-field presence is controlled by `@include` directives in the GraphQL
 * document — excluded fields are absent from `raw`, so `?? null` handles them.
 */
function parseChunks(raw: any): EncryptedAssetChunks {
  return {
    cids: raw.cids ?? null,
    iv: raw.iv ?? null,
    totalSize: raw.total_size != null ? Number(raw.total_size) : null,
  };
}

// ---------------------------------------------------------------------------
// Main parser — parseEncryptedAsset
// ---------------------------------------------------------------------------

/** Parse a raw Hasura row into a clean domain type. */
export function parseEncryptedAsset(raw: any): EncryptedAsset;
export function parseEncryptedAsset<const I extends EncryptedAssetInclude>(
  raw: any,
  include: I,
): EncryptedAssetResult<I>;
export function parseEncryptedAsset(
  raw: any,
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
    timestamp: raw.timestamp,

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
    // Uses `as any` cast for structural subtyping (sub-selection may omit `id`).
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
  };

  if (include) {
    // Normalize include for stripExcluded: dual-form fields (boolean or object) should map
    // to the field being included/excluded. Convert object forms to boolean for strip.
    const normalizedInclude: Record<string, boolean | Record<string, unknown> | undefined> = {
      ...include,
    };
    if (typeof include.encryption === 'object' && include.encryption != null) {
      normalizedInclude.encryption = true; // Object form = included
    }
    if (typeof include.file === 'object' && include.file != null) {
      normalizedInclude.file = true; // Object form = included
    }
    if (typeof include.chunks === 'object' && include.chunks != null) {
      normalizedInclude.chunks = true; // Object form = included
    }
    return stripExcluded(
      result,
      normalizedInclude,
      ['address', 'contentId', 'revision'],
      undefined,
      {
        universalProfile: { baseFields: ['address'] },
      },
    );
  }
  return result;
}

/** Batch variant of parseEncryptedAsset. */
export function parseEncryptedAssets(raw: any[]): EncryptedAsset[];
export function parseEncryptedAssets<const I extends EncryptedAssetInclude>(
  raw: any[],
  include: I,
): EncryptedAssetResult<I>[];
export function parseEncryptedAssets(
  raw: any[],
  include?: EncryptedAssetInclude,
): (EncryptedAsset | PartialEncryptedAsset)[] {
  if (include) return raw.map((r) => parseEncryptedAsset(r, include));
  return raw.map((r) => parseEncryptedAsset(r));
}
