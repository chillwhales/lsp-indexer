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

/** Access control condition — defines who can decrypt the asset. */
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

/** Encryption details — ciphertext, decryption params, and access control conditions. */
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

/** File metadata for an encrypted asset. */
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

/** Chunk information for an encrypted asset. */
export const EncryptedAssetChunksSchema = z.object({
  /** IPFS content identifiers for each chunk */
  cids: z.array(z.string()).nullable(),
  /** Initialization vector */
  iv: z.string().nullable(),
  /** Total size across all chunks (numeric → number) */
  totalSize: z.number().nullable(),
});

/** Images grouped by image_index — inner arrays are resolution variants. */
export const EncryptedAssetImagesSchema = z.array(z.array(ImageSchema));

// ---------------------------------------------------------------------------
// Core domain schema
// ---------------------------------------------------------------------------

/** LSP29 encrypted asset with nested relations. */
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
// Filter schema
// ---------------------------------------------------------------------------

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

/** `newest`/`oldest` use deterministic block-order; `direction`/`nulls` ignored for those. */
export const EncryptedAssetSortFieldSchema = z.enum([
  'newest',
  'oldest',
  'address',
  'contentId',
  'revision',
  'arrayIndex',
]);

export const EncryptedAssetSortSchema = z.object({
  field: EncryptedAssetSortFieldSchema,
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema
// ---------------------------------------------------------------------------

export const EncryptedAssetFileIncludeSchema = z.object({
  type: z.boolean().optional(),
  size: z.boolean().optional(),
  lastModified: z.boolean().optional(),
  hash: z.boolean().optional(),
});

export const EncryptedAssetChunksIncludeSchema = z.object({
  cids: z.boolean().optional(),
  iv: z.boolean().optional(),
  totalSize: z.boolean().optional(),
});

export const EncryptedAssetEncryptionIncludeSchema = z.object({
  method: z.boolean().optional(),
  ciphertext: z.boolean().optional(),
  dataToEncryptHash: z.boolean().optional(),
  decryptionCode: z.boolean().optional(),
  decryptionParams: z.boolean().optional(),
  accessControlConditions: z.boolean().optional(),
});

/** Omit = fetch all fields; set individual fields to opt-in. Sub-relations accept boolean or per-field object. */
export const EncryptedAssetIncludeSchema = z.object({
  arrayIndex: z.boolean().optional(),
  timestamp: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  encryption: z.union([z.boolean(), EncryptedAssetEncryptionIncludeSchema]).optional(),
  /** `name` always included when file is fetched. */
  file: z.union([z.boolean(), EncryptedAssetFileIncludeSchema]).optional(),
  chunks: z.union([z.boolean(), EncryptedAssetChunksIncludeSchema]).optional(),
  images: z.boolean().optional(),
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
// Inferred types
// ---------------------------------------------------------------------------

export type AccessControlCondition = z.infer<typeof AccessControlConditionSchema>;
export type EncryptedAssetEncryption = z.infer<typeof EncryptedAssetEncryptionSchema>;
export type EncryptedAssetEncryptionInclude = z.infer<typeof EncryptedAssetEncryptionIncludeSchema>;
export type EncryptedAssetFile = z.infer<typeof EncryptedAssetFileSchema>;
export type EncryptedAssetFileInclude = z.infer<typeof EncryptedAssetFileIncludeSchema>;
export type EncryptedAssetChunks = z.infer<typeof EncryptedAssetChunksSchema>;
export type EncryptedAssetChunksInclude = z.infer<typeof EncryptedAssetChunksIncludeSchema>;
export type EncryptedAssetImages = z.infer<typeof EncryptedAssetImagesSchema>;
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
