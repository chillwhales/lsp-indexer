import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
import type { IncludeResult, PartialExcept } from './include-types';
import {
  ProfileIncludeSchema,
  ProfileSchema,
  type ProfileInclude,
  type ProfileResult,
} from './profiles';

// ---------------------------------------------------------------------------
// Sub-type schemas — nested object schemas for encrypted asset relations
// ---------------------------------------------------------------------------

/**
 * An access control condition from the `lsp29_access_control_condition` table.
 *
 * Conditions define who can decrypt the encrypted asset (e.g., token holders,
 * address owners, follower relationships).
 */
export const AccessControlConditionSchema = z.object({
  /** Blockchain chain identifier */
  chain: z.string().nullable(),
  /** Comparison operator */
  comparator: z.string().nullable(),
  /** Position in conditions array */
  conditionIndex: z.number(),
  /** Contract address for the condition */
  contractAddress: z.string().nullable(),
  /** Follower address (for social conditions) */
  followerAddress: z.string().nullable(),
  /** Access control method */
  method: z.string().nullable(),
  /** Raw condition JSON string */
  rawCondition: z.string(),
  /** Standard contract type (ERC20, ERC721, etc.) */
  standardContractType: z.string().nullable(),
  /** Token ID for NFT conditions */
  tokenId: z.string().nullable(),
  /** Threshold value */
  value: z.string().nullable(),
});

/**
 * Encryption details from the `lsp29_encrypted_asset_encryption` table.
 *
 * Contains the ciphertext, decryption parameters, and optionally the
 * access control conditions array.
 */
export const EncryptedAssetEncryptionSchema = z.object({
  /** Encrypted ciphertext */
  ciphertext: z.string().nullable(),
  /** Hash of original data */
  dataToEncryptHash: z.string().nullable(),
  /** Decryption code */
  decryptionCode: z.string().nullable(),
  /** Decryption parameters (JSON string) */
  decryptionParams: z.string().nullable(),
  /** Encryption method identifier */
  method: z.string().nullable(),
  /** Access control conditions array (null = not included or empty) */
  accessControlConditions: z.array(AccessControlConditionSchema).nullable(),
});

/**
 * File metadata from the `lsp29_encrypted_asset_file` table.
 */
export const EncryptedAssetFileSchema = z.object({
  /** File hash */
  hash: z.string().nullable(),
  /** Last modified timestamp (numeric → number) */
  lastModified: z.number().nullable(),
  /** File name */
  name: z.string().nullable(),
  /** File size in bytes (numeric → number) */
  size: z.number().nullable(),
  /** MIME type */
  type: z.string().nullable(),
});

/**
 * Chunk information from the `lsp29_encrypted_asset_chunks` table.
 */
export const EncryptedAssetChunksSchema = z.object({
  /** IPFS content identifiers for each chunk */
  cids: z.array(z.string()).nullable(),
  /** Initialization vector */
  iv: z.string().nullable(),
  /** Total size across all chunks (numeric → number) */
  totalSize: z.number().nullable(),
});

/**
 * Image from the `lsp29_encrypted_asset_image` table.
 *
 * NOTE: LSP29 images differ from LSP4 images — they have `verificationSource`
 * and `imageIndex` which LSP4 images don't have.
 */
export const EncryptedAssetImageSchema = z.object({
  /** Position in images array */
  imageIndex: z.number(),
  /** Image URL */
  url: z.string().nullable(),
  /** Image width in pixels */
  width: z.number().nullable(),
  /** Image height in pixels */
  height: z.number().nullable(),
  /** Verification data hash */
  verificationData: z.string().nullable(),
  /** Verification method */
  verificationMethod: z.string().nullable(),
  /** Verification source URL */
  verificationSource: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/**
 * An LSP29 encrypted asset from the `lsp29_encrypted_asset` Hasura table.
 *
 * Represents rich encrypted asset metadata with nested relations (encryption,
 * file, chunks, images, title/description wrappers, universal profile).
 * Base fields (`address`, `contentId`, `revision`) are always present.
 */
export const EncryptedAssetSchema = z.object({
  /** Universal Profile address that owns this encrypted asset (always present) */
  address: z.string(),
  /** Content identifier (always present, nullable — may not be set) */
  contentId: z.string().nullable(),
  /** Revision number (always present, nullable — may not be set) */
  revision: z.number().nullable(),
  /** Position in array (null = not included or not set) */
  arrayIndex: z.number().nullable(),
  /** Timestamp when indexed (ISO string) */
  timestamp: z.string(),
  /** Title text, flattened from title.value wrapper (null = not included or not set) */
  title: z.string().nullable(),
  /** Description text, flattened from description.value wrapper (null = not included or not set) */
  description: z.string().nullable(),
  /** Encryption details with optional access control conditions (null = not included) */
  encryption: EncryptedAssetEncryptionSchema.nullable(),
  /** File metadata (null = not included) */
  file: EncryptedAssetFileSchema.nullable(),
  /** Chunk information (null = not included) */
  chunks: EncryptedAssetChunksSchema.nullable(),
  /** Image array (null = not included, [] = included but empty) */
  images: z.array(EncryptedAssetImageSchema).nullable(),
  /** Universal Profile of the owner (null = not included in query) */
  universalProfile: ProfileSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema — all 8 filter fields from CONTEXT.md
// ---------------------------------------------------------------------------

/**
 * Filter for encrypted asset queries.
 *
 * All 8 filter fields from CONTEXT.md — string fields use `_ilike` (case-insensitive),
 * numeric/timestamp fields use `_gte` for range filtering.
 */
export const EncryptedAssetFilterSchema = z.object({
  /** Case-insensitive match on UP address (uses _ilike) */
  address: z.string().optional(),
  /** Case-insensitive search on profile name (nested universalProfile → lsp3Profile → name) */
  universalProfileName: z.string().optional(),
  /** Case-insensitive match on content ID */
  contentId: z.string().optional(),
  /** Exact match on revision number */
  revision: z.number().optional(),
  /** Case-insensitive match on encryption method (nested encryption.method) */
  encryptionMethod: z.string().optional(),
  /** Case-insensitive match on file type (nested file.type) */
  fileType: z.string().optional(),
  /** Numeric filter on file size (nested file.size) — entries with file.size >= this value */
  fileSize: z.number().optional(),
  /** ISO timestamp or unix seconds — entries with timestamp >= this value */
  timestamp: z.union([z.string(), z.number()]).optional(),
});

// ---------------------------------------------------------------------------
// Sort schema
// ---------------------------------------------------------------------------

/**
 * Fields available for sorting encrypted asset lists.
 */
export const EncryptedAssetSortFieldSchema = z.enum([
  'timestamp',
  'address',
  'contentId',
  'revision',
  'arrayIndex',
]);

export const EncryptedAssetSortSchema = z.object({
  /** Which field to sort by */
  field: EncryptedAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema — most complex due to encryption sub-include
// ---------------------------------------------------------------------------

/** Sub-include for encryption — controls whether access control conditions array is fetched */
export const EncryptedAssetEncryptionIncludeSchema = z.object({
  accessControlConditions: z.boolean().optional(),
});

/**
 * Controls which optional fields are fetched for encrypted asset queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Encryption sub-include:** `encryption` accepts either a boolean or an
 * object with `accessControlConditions` toggle:
 * - `true` → fetch all encryption fields INCLUDING accessControlConditions
 * - `{ accessControlConditions: true }` → same as true
 * - `{ accessControlConditions: false }` or `{}` → encryption scalars only, NO access control conditions
 * - `false` / omitted → don't fetch encryption at all
 */
export const EncryptedAssetIncludeSchema = z.object({
  /** Include array index */
  arrayIndex: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include title text (flattened from title.value) */
  title: z.boolean().optional(),
  /** Include description text (flattened from description.value) */
  description: z.boolean().optional(),
  /**
   * Include encryption details.
   * - `true` → fetch all encryption fields INCLUDING accessControlConditions
   * - `{ accessControlConditions: true }` → same as true
   * - `{ accessControlConditions: false }` or `{}` → fetch encryption scalars only, NO access control conditions
   * - `false` / omitted → don't fetch encryption at all
   */
  encryption: z.union([z.boolean(), EncryptedAssetEncryptionIncludeSchema]).optional(),
  /** Include file metadata */
  file: z.boolean().optional(),
  /** Include chunks data */
  chunks: z.boolean().optional(),
  /** Include images array */
  images: z.boolean().optional(),
  /** Include Universal Profile — sub-fields control which profile attributes to fetch */
  universalProfile: ProfileIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 2 hooks (no singular hook)
// ---------------------------------------------------------------------------

/** Params for useEncryptedAssets — paginated list of encrypted assets */
export const UseEncryptedAssetsParamsSchema = z.object({
  filter: EncryptedAssetFilterSchema.optional(),
  sort: EncryptedAssetSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: EncryptedAssetIncludeSchema.optional(),
});

/** Params for useInfiniteEncryptedAssets — infinite scroll variant */
export const UseInfiniteEncryptedAssetsParamsSchema = z.object({
  filter: EncryptedAssetFilterSchema.optional(),
  sort: EncryptedAssetSortSchema.optional(),
  pageSize: z.number().optional(),
  include: EncryptedAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type AccessControlCondition = z.infer<typeof AccessControlConditionSchema>;
export type EncryptedAssetEncryption = z.infer<typeof EncryptedAssetEncryptionSchema>;
export type EncryptedAssetEncryptionInclude = z.infer<typeof EncryptedAssetEncryptionIncludeSchema>;
export type EncryptedAssetFile = z.infer<typeof EncryptedAssetFileSchema>;
export type EncryptedAssetChunks = z.infer<typeof EncryptedAssetChunksSchema>;
export type EncryptedAssetImage = z.infer<typeof EncryptedAssetImageSchema>;
export type EncryptedAsset = z.infer<typeof EncryptedAssetSchema>;
export type EncryptedAssetFilter = z.infer<typeof EncryptedAssetFilterSchema>;
export type EncryptedAssetSortField = z.infer<typeof EncryptedAssetSortFieldSchema>;
export type EncryptedAssetSort = z.infer<typeof EncryptedAssetSortSchema>;
export type EncryptedAssetInclude = z.infer<typeof EncryptedAssetIncludeSchema>;
export type UseEncryptedAssetsParams = z.infer<typeof UseEncryptedAssetsParamsSchema>;
export type UseInfiniteEncryptedAssetsParams = z.infer<
  typeof UseInfiniteEncryptedAssetsParamsSchema
>;

// ---------------------------------------------------------------------------
// Conditional include result type (DX-04)
// ---------------------------------------------------------------------------

/**
 * Scalar/boolean include fields: include key → EncryptedAsset field name.
 * Relations with sub-includes (encryption, universalProfile) handled by resolver types.
 */
type EncryptedAssetScalarIncludeFieldMap = {
  arrayIndex: 'arrayIndex';
  timestamp: 'timestamp';
  title: 'title';
  description: 'description';
  file: 'file';
  chunks: 'chunks';
  images: 'images';
};

/**
 * Base encryption type WITHOUT accessControlConditions.
 * Used when encryption is included as an object without accessControlConditions: true.
 */
type EncryptedAssetEncryptionBase = Omit<EncryptedAssetEncryption, 'accessControlConditions'>;

/**
 * Resolve encryption based on include parameter.
 * - true → full EncryptedAssetEncryption (with accessControlConditions)
 * - { accessControlConditions: true } → full EncryptedAssetEncryption
 * - { accessControlConditions: false } or {} → base only (no accessControlConditions)
 * - false/omitted → field absent from type
 */
type ResolveEncryption<I> = I extends { encryption: infer E }
  ? E extends true
    ? { encryption: EncryptedAssetEncryption | null }
    : E extends { accessControlConditions: true }
      ? { encryption: EncryptedAssetEncryption | null }
      : E extends Record<string, unknown>
        ? { encryption: EncryptedAssetEncryptionBase | null }
        : {}
  : {};

/**
 * Resolve nested `universalProfile` relation based on include parameter.
 * When include has `universalProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveUniversalProfile<I> = I extends { universalProfile: infer P }
  ? P extends ProfileInclude
    ? { universalProfile: ProfileResult<P> | null }
    : {}
  : {};

/**
 * EncryptedAsset type narrowed by include parameter.
 *
 * - `EncryptedAssetResult` (no generic) → full `EncryptedAsset` type (backward compatible)
 * - `EncryptedAssetResult<{}>` → `{ address; contentId; revision }` (base fields only)
 * - `EncryptedAssetResult<{ timestamp: true }>` → base + timestamp
 * - `EncryptedAssetResult<{ encryption: true }>` → base + full encryption (with access control conditions)
 * - `EncryptedAssetResult<{ encryption: { accessControlConditions: false } }>` → base + encryption scalars only
 * - `EncryptedAssetResult<{ universalProfile: { name: true } }>` → base + narrowed profile
 *
 * @example
 * ```ts
 * type Full = EncryptedAssetResult;                                                    // = EncryptedAsset (all fields)
 * type Minimal = EncryptedAssetResult<{}>;                                             // = { address; contentId; revision }
 * type WithEnc = EncryptedAssetResult<{ encryption: true }>;                           // = base + full encryption
 * type EncNoAcc = EncryptedAssetResult<{ encryption: {} }>;                            // = base + encryption scalars (no ACC)
 * type WithProf = EncryptedAssetResult<{ universalProfile: { name: true } }>;          // = base + narrowed profile
 * ```
 */
export type EncryptedAssetResult<I extends EncryptedAssetInclude | undefined = undefined> =
  I extends undefined
    ? EncryptedAsset
    : IncludeResult<
        EncryptedAsset,
        'address' | 'contentId' | 'revision',
        EncryptedAssetScalarIncludeFieldMap,
        I
      > &
        ResolveEncryption<NonNullable<I>> &
        ResolveUniversalProfile<NonNullable<I>>;

/**
 * EncryptedAsset with only base fields guaranteed — used for components that accept
 * any include-narrowed EncryptedAsset.
 */
export type PartialEncryptedAsset = PartialExcept<
  EncryptedAsset,
  'address' | 'contentId' | 'revision'
>;
