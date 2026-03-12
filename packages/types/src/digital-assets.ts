import { z } from 'zod';

import {
  ImageSchema,
  LinkSchema,
  Lsp4AttributeSchema,
  SortDirectionSchema,
  SortNullsSchema,
} from './common';
import type { IncludeResult, PartialExcept } from './include-types';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** Derived from presence of `decimals` field at parse time. */
export const StandardSchema = z.enum(['LSP7', 'LSP8']);

export const TokenTypeSchema = z.enum(['TOKEN', 'NFT', 'COLLECTION']);

export const DigitalAssetOwnerSchema = z.object({
  address: z.string(),
  timestamp: z.string(),
});

export const DigitalAssetSchema = z.object({
  address: z.string(),
  /** Derived from `decimals` — LSP7 when present, LSP8 when null. */
  standard: StandardSchema.nullable(),
  name: z.string().nullable(),
  symbol: z.string().nullable(),
  /** TOKEN, NFT, or COLLECTION classification. */
  tokenType: TokenTypeSchema.nullable(),
  /** LSP7 only — null for LSP8. */
  decimals: z.number().nullable(),
  /** bigint for uint256 precision. */
  totalSupply: z.bigint().nullable(),
  description: z.string().nullable(),
  /** Free-form tag from LSP4 metadata (e.g. "DeFi", "Collectible"). */
  category: z.string().nullable(),
  /** Icon images from LSP4 metadata. */
  icons: z.array(ImageSchema).nullable(),
  /** Grouped by image_index. */
  images: z.array(z.array(ImageSchema)).nullable(),
  /** External links from LSP4 metadata. */
  links: z.array(LinkSchema).nullable(),
  /** Key-value attributes from LSP4 metadata. */
  attributes: z.array(Lsp4AttributeSchema).nullable(),
  /** Current owner address and timestamp of last ownership transfer. */
  owner: DigitalAssetOwnerSchema.nullable(),
  /** Number of unique addresses holding this token. */
  holderCount: z.number().nullable(),
  /** Number of addresses listed as creators. */
  creatorCount: z.number().nullable(),
  /** LSP8-only. */
  referenceContract: z.string().nullable(),
  /** LSP8-only. */
  tokenIdFormat: z.string().nullable(),
  /** LSP8-only. */
  baseUri: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const DigitalAssetFilterSchema = z.object({
  /** Case-insensitive partial match on token name */
  name: z.string().optional(),
  /** Case-insensitive partial match on token symbol */
  symbol: z.string().optional(),
  /** Filter by token type (TOKEN, NFT, or COLLECTION) */
  tokenType: TokenTypeSchema.optional(),
  /** Filter by LSP4 metadata category */
  category: z.string().optional(),
  /** Return tokens held by the given address */
  holderAddress: z.string().optional(),
  /** Return tokens owned by the given address */
  ownerAddress: z.string().optional(),
});

/** `newest`/`oldest` use deterministic block-order; `direction`/`nulls` ignored for those. */
export const DigitalAssetSortFieldSchema = z.enum([
  'newest',
  'oldest',
  'name',
  'symbol',
  'holderCount',
  'creatorCount',
  'totalSupply',
  'createdAt',
]);

export const DigitalAssetSortSchema = z.object({
  field: DigitalAssetSortFieldSchema,
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

/** Omit = fetch all fields; set individual fields to opt-in. */
export const DigitalAssetIncludeSchema = z.object({
  /** Include token name */
  name: z.boolean().optional(),
  /** Include token symbol */
  symbol: z.boolean().optional(),
  /** Include token type classification */
  tokenType: z.boolean().optional(),
  /** Include decimals (also enables derived `standard` field) */
  decimals: z.boolean().optional(),
  /** Include total supply */
  totalSupply: z.boolean().optional(),
  /** Include description */
  description: z.boolean().optional(),
  /** Include LSP4 category */
  category: z.boolean().optional(),
  /** Include icon images */
  icons: z.boolean().optional(),
  /** Include grouped images */
  images: z.boolean().optional(),
  /** Include external links */
  links: z.boolean().optional(),
  /** Include key-value attributes */
  attributes: z.boolean().optional(),
  /** Include current owner */
  owner: z.boolean().optional(),
  /** Include holder count aggregate */
  holderCount: z.boolean().optional(),
  /** Include creator count aggregate */
  creatorCount: z.boolean().optional(),
  /** Include LSP8 reference contract address */
  referenceContract: z.boolean().optional(),
  /** Include LSP8 token ID format */
  tokenIdFormat: z.boolean().optional(),
  /** Include LSP8 base URI */
  baseUri: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseDigitalAssetParamsSchema = z.object({
  address: z.string(),
  include: DigitalAssetIncludeSchema.optional(),
});

export const UseDigitalAssetsParamsSchema = z.object({
  filter: DigitalAssetFilterSchema.optional(),
  sort: DigitalAssetSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: DigitalAssetIncludeSchema.optional(),
});

export const UseInfiniteDigitalAssetsParamsSchema = z.object({
  filter: DigitalAssetFilterSchema.optional(),
  sort: DigitalAssetSortSchema.optional(),
  pageSize: z.number().optional(),
  include: DigitalAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Standard = z.infer<typeof StandardSchema>;
export type TokenType = z.infer<typeof TokenTypeSchema>;
export type DigitalAssetOwner = z.infer<typeof DigitalAssetOwnerSchema>;
export type DigitalAsset = z.infer<typeof DigitalAssetSchema>;
export type DigitalAssetFilter = z.infer<typeof DigitalAssetFilterSchema>;
export type DigitalAssetSortField = z.infer<typeof DigitalAssetSortFieldSchema>;
export type DigitalAssetSort = z.infer<typeof DigitalAssetSortSchema>;
export type DigitalAssetInclude = z.infer<typeof DigitalAssetIncludeSchema>;
export type UseDigitalAssetParams = z.infer<typeof UseDigitalAssetParamsSchema>;
export type UseDigitalAssetsParams = z.infer<typeof UseDigitalAssetsParamsSchema>;
export type UseInfiniteDigitalAssetsParams = z.infer<typeof UseInfiniteDigitalAssetsParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Include field map: include schema key → DigitalAsset field name.
 * For digital assets, the mapping is 1:1 (include key matches field name exactly).
 * Note: `standard` is NOT in this map — it's a derived field handled by `ResolveStandard`.
 */
type DigitalAssetIncludeFieldMap = {
  name: 'name';
  symbol: 'symbol';
  tokenType: 'tokenType';
  decimals: 'decimals';
  totalSupply: 'totalSupply';
  description: 'description';
  category: 'category';
  icons: 'icons';
  images: 'images';
  links: 'links';
  attributes: 'attributes';
  owner: 'owner';
  holderCount: 'holderCount';
  creatorCount: 'creatorCount';
  referenceContract: 'referenceContract';
  tokenIdFormat: 'tokenIdFormat';
  baseUri: 'baseUri';
};

/**
 * Resolve the `standard` derived field based on whether `decimals` is included.
 *
 * `standard` is derived from `decimals` at parse time — LSP7 when decimals has a value,
 * LSP8 when decimals is null. If `decimals` is not included, `standard` should also be
 * absent from the return type.
 */
type ResolveStandard<I> = I extends { decimals: true } ? { standard: Standard | null } : {};

/**
 * DigitalAsset type narrowed by include parameter.
 *
 * - `DigitalAssetResult` (no generic) → full `DigitalAsset` type (backward compatible)
 * - `DigitalAssetResult<{}>` → `{ address: string }` (base fields only)
 * - `DigitalAssetResult<{ name: true }>` → `{ address: string; name: string | null }`
 * - `DigitalAssetResult<{ decimals: true }>` → `{ address: string; decimals: number | null; standard: Standard | null }`
 *
 * The `standard` field follows `decimals` — it's only present when `decimals` is included,
 * because it's derived from the `decimals` value at parse time.
 *
 * @example
 * ```ts
 * type Full = DigitalAssetResult;                          // = DigitalAsset (all fields)
 * type Minimal = DigitalAssetResult<{}>;                   // = { address: string }
 * type NameOnly = DigitalAssetResult<{ name: true }>;      // = { address: string; name: string | null }
 * type WithDec = DigitalAssetResult<{ decimals: true }>;   // = { address: string; decimals: number | null; standard: Standard | null }
 * ```
 */
export type DigitalAssetResult<I extends DigitalAssetInclude | undefined = undefined> =
  I extends undefined
    ? DigitalAsset
    : IncludeResult<DigitalAsset, 'address', DigitalAssetIncludeFieldMap, I> &
        ResolveStandard<NonNullable<I>>;

/**
 * DigitalAsset with only base fields guaranteed — used for functions that accept
 * any include-narrowed digital asset. All non-base fields are optional.
 *
 * Equivalent to `PartialExcept<DigitalAsset, 'address'>`.
 */
export type PartialDigitalAsset = PartialExcept<DigitalAsset, 'address'>;
