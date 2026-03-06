import { z } from 'zod';

import { ImageSchema, SortDirectionSchema, SortNullsSchema } from './common';
import type { IncludeResult, PartialExcept } from './include-types';
import {
  ProfileIncludeSchema,
  ProfileSchema,
  type Profile,
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
 * Images matrix — array of arrays where each inner array groups image
 * resolutions (different widths) for the same logical image, indexed by
 * `image_index` from the Hasura table.
 *
 * Reuses the shared `Image` type (url, width, height, verification).
 */
export const EncryptedAssetImagesSchema = z.array(z.array(ImageSchema));

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
  /** Images matrix grouped by image_index (null = not included, [] = included but empty) */
  images: EncryptedAssetImagesSchema.nullable(),
  /** Universal Profile of the owner (null = not included in query) */
  universalProfile: ProfileSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema — all 8 filter fields
// ---------------------------------------------------------------------------

/**
 * Filter for encrypted asset queries.
 *
 * All 8 filter fields — string fields use `_ilike` (case-insensitive).
 * `fileSize` and `timestamp` use `_gte` for range filtering; `revision` is exact-match.
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

/** Zod schema for encrypted asset sort configuration — validates field, direction, and null ordering. */
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

/** Sub-include for file — controls which file sub-fields are fetched */
export const EncryptedAssetFileIncludeSchema = z.object({
  /** Include file MIME type */
  type: z.boolean().optional(),
  /** Include file size in bytes */
  size: z.boolean().optional(),
  /** Include last modified timestamp */
  lastModified: z.boolean().optional(),
  /** Include file hash */
  hash: z.boolean().optional(),
});

/** Sub-include for chunks — controls which chunk sub-fields are fetched */
export const EncryptedAssetChunksIncludeSchema = z.object({
  /** Include IPFS content identifiers */
  cids: z.boolean().optional(),
  /** Include initialization vector */
  iv: z.boolean().optional(),
  /** Include total size across all chunks */
  totalSize: z.boolean().optional(),
});

/** Sub-include for encryption — controls which encryption sub-fields are fetched */
export const EncryptedAssetEncryptionIncludeSchema = z.object({
  /** Include encryption method identifier */
  method: z.boolean().optional(),
  /** Include encrypted ciphertext */
  ciphertext: z.boolean().optional(),
  /** Include hash of original data */
  dataToEncryptHash: z.boolean().optional(),
  /** Include decryption code */
  decryptionCode: z.boolean().optional(),
  /** Include decryption parameters (JSON string) */
  decryptionParams: z.boolean().optional(),
  /** Include access control conditions array */
  accessControlConditions: z.boolean().optional(),
});

/**
 * Controls which optional fields are fetched for encrypted asset queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Sub-include relations:** `encryption`, `file`, and `chunks` each accept either a
 * boolean or an object with per-field toggles:
 * - `true` → fetch the relation with ALL sub-fields
 * - `{ fieldA: true, fieldB: false }` → fetch relation with only selected sub-fields
 * - `{}` → fetch relation with no optional sub-fields (base only where applicable)
 * - `false` / omitted → don't fetch the relation at all
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
   * - `{ field: true/false }` → fetch encryption with selected sub-fields
   * - `false` / omitted → don't fetch encryption at all
   */
  encryption: z.union([z.boolean(), EncryptedAssetEncryptionIncludeSchema]).optional(),
  /**
   * Include file metadata.
   * - `true` → fetch all file fields (name always included)
   * - `{ type: true, size: true }` → fetch file with selected sub-fields (name always included)
   * - `false` / omitted → don't fetch file at all
   */
  file: z.union([z.boolean(), EncryptedAssetFileIncludeSchema]).optional(),
  /**
   * Include chunks data.
   * - `true` → fetch all chunks fields
   * - `{ cids: true, iv: false }` → fetch chunks with selected sub-fields
   * - `false` / omitted → don't fetch chunks at all
   */
  chunks: z.union([z.boolean(), EncryptedAssetChunksIncludeSchema]).optional(),
  /** Include images array */
  images: z.boolean().optional(),
  /** Include Universal Profile — `true` for all fields, or object for per-field control */
  universalProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
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

/** Access control condition for LSP29 encrypted content. See {@link AccessControlConditionSchema}. */
export type AccessControlCondition = z.infer<typeof AccessControlConditionSchema>;
/** Encryption metadata for an encrypted asset. See {@link EncryptedAssetEncryptionSchema}. */
export type EncryptedAssetEncryption = z.infer<typeof EncryptedAssetEncryptionSchema>;
/** Sub-include for encryption fields. See {@link EncryptedAssetEncryptionIncludeSchema}. */
export type EncryptedAssetEncryptionInclude = z.infer<typeof EncryptedAssetEncryptionIncludeSchema>;
/** File metadata for an encrypted asset. See {@link EncryptedAssetFileSchema}. */
export type EncryptedAssetFile = z.infer<typeof EncryptedAssetFileSchema>;
/** Sub-include for file metadata fields. See {@link EncryptedAssetFileIncludeSchema}. */
export type EncryptedAssetFileInclude = z.infer<typeof EncryptedAssetFileIncludeSchema>;
/** Chunk data for an encrypted asset. See {@link EncryptedAssetChunksSchema}. */
export type EncryptedAssetChunks = z.infer<typeof EncryptedAssetChunksSchema>;
/** Sub-include for chunk fields. See {@link EncryptedAssetChunksIncludeSchema}. */
export type EncryptedAssetChunksInclude = z.infer<typeof EncryptedAssetChunksIncludeSchema>;
/** Images matrix — `Image[][]` grouped by image_index. See {@link EncryptedAssetImagesSchema}. */
export type EncryptedAssetImages = z.infer<typeof EncryptedAssetImagesSchema>;
/** Clean camelCase encrypted asset after parsing from Hasura. See {@link EncryptedAssetSchema}. */
export type EncryptedAsset = z.infer<typeof EncryptedAssetSchema>;
/** Encrypted asset query filter parameters. See {@link EncryptedAssetFilterSchema}. */
export type EncryptedAssetFilter = z.infer<typeof EncryptedAssetFilterSchema>;
/** Available fields for sorting encrypted assets. See {@link EncryptedAssetSortFieldSchema}. */
export type EncryptedAssetSortField = z.infer<typeof EncryptedAssetSortFieldSchema>;
/** Encrypted asset sort configuration. See {@link EncryptedAssetSortSchema}. */
export type EncryptedAssetSort = z.infer<typeof EncryptedAssetSortSchema>;
/** Field inclusion config for encrypted asset queries. See {@link EncryptedAssetIncludeSchema}. */
export type EncryptedAssetInclude = z.infer<typeof EncryptedAssetIncludeSchema>;
/** Parameters for the `useEncryptedAssets` hook. See {@link UseEncryptedAssetsParamsSchema}. */
export type UseEncryptedAssetsParams = z.infer<typeof UseEncryptedAssetsParamsSchema>;
/** Parameters for the `useInfiniteEncryptedAssets` hook. See {@link UseInfiniteEncryptedAssetsParamsSchema}. */
export type UseInfiniteEncryptedAssetsParams = z.infer<
  typeof UseInfiniteEncryptedAssetsParamsSchema
>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar/boolean include fields: include key → EncryptedAsset field name.
 * Relations with sub-includes (encryption, file, chunks, universalProfile) handled by resolver types.
 */
type EncryptedAssetScalarIncludeFieldMap = {
  arrayIndex: 'arrayIndex';
  timestamp: 'timestamp';
  title: 'title';
  description: 'description';
  images: 'images';
};

/**
 * Field map for encryption sub-include: include key → EncryptedAssetEncryption field name.
 * No base fields — all fields are opt-in via sub-include.
 */
type EncryptionIncludeFieldMap = {
  method: 'method';
  ciphertext: 'ciphertext';
  dataToEncryptHash: 'dataToEncryptHash';
  decryptionCode: 'decryptionCode';
  decryptionParams: 'decryptionParams';
  accessControlConditions: 'accessControlConditions';
};

/**
 * Field map for file sub-include: include key → EncryptedAssetFile field name.
 * Base field `name` is always present when file is included.
 */
type FileIncludeFieldMap = {
  type: 'type';
  size: 'size';
  lastModified: 'lastModified';
  hash: 'hash';
};

/**
 * Field map for chunks sub-include: include key → EncryptedAssetChunks field name.
 * No base fields — all fields are opt-in via sub-include.
 */
type ChunksIncludeFieldMap = {
  cids: 'cids';
  iv: 'iv';
  totalSize: 'totalSize';
};

/**
 * Resolve encryption based on include parameter.
 * - true → full EncryptedAssetEncryption (all sub-fields)
 * - `{ method: true }` → only method present in type
 * - false/omitted → field absent from type
 */
type ResolveEncryption<I> = I extends { encryption: infer E }
  ? E extends true
    ? { encryption: EncryptedAssetEncryption | null }
    : E extends EncryptedAssetEncryptionInclude
      ? {
          encryption: IncludeResult<
            EncryptedAssetEncryption,
            never,
            EncryptionIncludeFieldMap,
            E
          > | null;
        }
      : {}
  : {};

/**
 * Resolve file based on include parameter.
 * - true → full EncryptedAssetFile (all sub-fields)
 * - `{ type: true, size: true }` → file with name (base) + type + size
 * - false/omitted → field absent from type
 */
type ResolveFile<I> = I extends { file: infer E }
  ? E extends true
    ? { file: EncryptedAssetFile | null }
    : E extends EncryptedAssetFileInclude
      ? { file: IncludeResult<EncryptedAssetFile, 'name', FileIncludeFieldMap, E> | null }
      : {}
  : {};

/**
 * Resolve chunks based on include parameter.
 * - true → full EncryptedAssetChunks (all sub-fields)
 * - `{ cids: true }` → only cids present in type
 * - false/omitted → field absent from type
 */
type ResolveChunks<I> = I extends { chunks: infer E }
  ? E extends true
    ? { chunks: EncryptedAssetChunks | null }
    : E extends EncryptedAssetChunksInclude
      ? { chunks: IncludeResult<EncryptedAssetChunks, never, ChunksIncludeFieldMap, E> | null }
      : {}
  : {};

/**
 * Resolve nested `universalProfile` relation based on include parameter.
 * When include has `universalProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveUniversalProfile<I> = I extends { universalProfile: infer P }
  ? P extends true
    ? { universalProfile: Profile | null }
    : P extends ProfileInclude
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
 * - `EncryptedAssetResult<{ encryption: { accessControlConditions: true } }>` → base + encryption with ACC only
 * - `EncryptedAssetResult<{ file: { type: true, size: true } }>` → base + file with type & size (name always included)
 * - `EncryptedAssetResult<{ chunks: { cids: true } }>` → base + chunks with cids only
 * - `EncryptedAssetResult<{ universalProfile: { name: true } }>` → base + narrowed profile
 *
 * @example
 * ```ts
 * type Full = EncryptedAssetResult;                                                    // = EncryptedAsset (all fields)
 * type Minimal = EncryptedAssetResult<{}>;                                             // = { address; contentId; revision }
 * type WithEnc = EncryptedAssetResult<{ encryption: true }>;                           // = base + full encryption
 * type EncSub = EncryptedAssetResult<{ encryption: { method: true } }>;                // = base + encryption (method only)
 * type WithFile = EncryptedAssetResult<{ file: { type: true, size: true } }>;          // = base + file (type, size + name)
 * type WithChunks = EncryptedAssetResult<{ chunks: { cids: true } }>;                  // = base + chunks (cids only)
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
        ResolveFile<NonNullable<I>> &
        ResolveChunks<NonNullable<I>> &
        ResolveUniversalProfile<NonNullable<I>>;

/**
 * EncryptedAsset with only base fields guaranteed — used for components that accept
 * any include-narrowed EncryptedAsset.
 */
export type PartialEncryptedAsset = PartialExcept<
  EncryptedAsset,
  'address' | 'contentId' | 'revision'
>;
