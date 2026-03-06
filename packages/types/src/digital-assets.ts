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
  tokenType: TokenTypeSchema.nullable(),
  /** LSP7 only — null for LSP8. */
  decimals: z.number().nullable(),
  /** bigint for uint256 precision. */
  totalSupply: z.bigint().nullable(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  icons: z.array(ImageSchema).nullable(),
  /** Grouped by image_index. */
  images: z.array(z.array(ImageSchema)).nullable(),
  links: z.array(LinkSchema).nullable(),
  attributes: z.array(Lsp4AttributeSchema).nullable(),
  owner: DigitalAssetOwnerSchema.nullable(),
  holderCount: z.number().nullable(),
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
  name: z.string().optional(),
  symbol: z.string().optional(),
  tokenType: TokenTypeSchema.optional(),
  category: z.string().optional(),
  holderAddress: z.string().optional(),
  ownerAddress: z.string().optional(),
});

export const DigitalAssetSortFieldSchema = z.enum([
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
  name: z.boolean().optional(),
  symbol: z.boolean().optional(),
  tokenType: z.boolean().optional(),
  decimals: z.boolean().optional(),
  totalSupply: z.boolean().optional(),
  description: z.boolean().optional(),
  category: z.boolean().optional(),
  icons: z.boolean().optional(),
  images: z.boolean().optional(),
  links: z.boolean().optional(),
  attributes: z.boolean().optional(),
  owner: z.boolean().optional(),
  holderCount: z.boolean().optional(),
  creatorCount: z.boolean().optional(),
  referenceContract: z.boolean().optional(),
  tokenIdFormat: z.boolean().optional(),
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
