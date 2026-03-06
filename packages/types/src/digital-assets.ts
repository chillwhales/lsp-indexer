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

/** LSP7 or LSP8 standard — derived by parser from presence of `decimals` field */
export const StandardSchema = z.enum(['LSP7', 'LSP8']);

/**
 * Token type for a digital asset.
 * The indexer stores these as decoded strings directly.
 * - TOKEN: Fungible token (LSP4 tokenType 0)
 * - NFT: Non-fungible token (LSP4 tokenType 1)
 * - COLLECTION: Collection of NFTs (LSP4 tokenType 2)
 */
export const TokenTypeSchema = z.enum(['TOKEN', 'NFT', 'COLLECTION']);

/** Contract owner (controller) of the digital asset */
export const DigitalAssetOwnerSchema = z.object({
  /** Owner contract address */
  address: z.string(),
  /** Timestamp when ownership was last set */
  timestamp: z.string(),
});

/** Full digital asset domain type with all includable fields */
export const DigitalAssetSchema = z.object({
  /** The digital asset contract address (checksummed or lowercase hex) — always present */
  address: z.string(),
  /**
   * Derived standard — LSP7 (fungible) or LSP8 (non-fungible).
   * Parser derives this from presence of the `decimals` field (LSP7 only).
   */
  standard: StandardSchema.nullable(),
  /** Token name from LSP4 metadata, or `null` if not set or not included */
  name: z.string().nullable(),
  /** Token symbol from LSP4 metadata (e.g., "CHILL"), or `null` if not set or not included */
  symbol: z.string().nullable(),
  /**
   * Token type — decoded string stored directly by the indexer.
   * - TOKEN: Fungible token
   * - NFT: Non-fungible token
   * - COLLECTION: Collection of NFTs
   */
  tokenType: TokenTypeSchema.nullable(),
  /** Number of decimal places (LSP7 only), or `null` for LSP8 or if not included */
  decimals: z.number().nullable(),
  /** Total supply of tokens (bigint for uint256 precision), or `null` if not included */
  totalSupply: z.bigint().nullable(),
  /** Description from LSP4 metadata, or `null` if not set or not included */
  description: z.string().nullable(),
  /** Category from LSP4 metadata (free-text), or `null` if not set or not included */
  category: z.string().nullable(),
  /** Icon images from LSP4 metadata, or `null` if not included in query */
  icons: z.array(ImageSchema).nullable(),
  /** Gallery/cover images from LSP4 metadata grouped by image_index, or `null` if not included in query */
  images: z.array(z.array(ImageSchema)).nullable(),
  /** External links from LSP4 metadata, or `null` if not included in query */
  links: z.array(LinkSchema).nullable(),
  /** NFT metadata attributes/traits, or `null` if not included in query */
  attributes: z.array(Lsp4AttributeSchema).nullable(),
  /** Contract owner (controller), or `null` if not included or not set */
  owner: DigitalAssetOwnerSchema.nullable(),
  /** Number of unique token holders, or `null` if not included */
  holderCount: z.number().nullable(),
  /** Number of creators registered on the asset, or `null` if not included */
  creatorCount: z.number().nullable(),
  /** LSP8-only: Reference contract address, or `null` for LSP7 or if not included */
  referenceContract: z.string().nullable(),
  /** LSP8-only: Token ID format identifier, or `null` for LSP7 or if not included */
  tokenIdFormat: z.string().nullable(),
  /** LSP8-only: Base URI for token metadata, or `null` for LSP7 or if not included */
  baseUri: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/** Filter criteria for digital asset queries */
export const DigitalAssetFilterSchema = z.object({
  /** Case-insensitive partial match on token name */
  name: z.string().optional(),
  /** Case-insensitive partial match on token symbol */
  symbol: z.string().optional(),
  /** Filter by token type */
  tokenType: TokenTypeSchema.optional(),
  /** Case-insensitive partial match on LSP4 metadata category */
  category: z.string().optional(),
  /** Return assets held by the given address (token holder) */
  holderAddress: z.string().optional(),
  /** Return assets owned (controlled) by the given address */
  ownerAddress: z.string().optional(),
});

/** Fields available for sorting digital asset lists */
export const DigitalAssetSortFieldSchema = z.enum([
  'name',
  'symbol',
  'holderCount',
  'creatorCount',
  'totalSupply',
  'createdAt',
]);

/** Zod schema for digital asset sort configuration — validates field, direction, and null ordering. */
export const DigitalAssetSortSchema = z.object({
  /** Which field to sort by */
  field: DigitalAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default (nulls last for asc, nulls first for desc) */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which nested fields to include in a digital asset query.
 *
 * **Behavior (inverted default):**
 * - When `include` is **omitted** entirely → all fields are fetched (opt-out model).
 *   GraphQL variables default to `true`, so all `@include(if:)` directives pass.
 * - When `include` is **provided** → only fields explicitly set to `true` are included;
 *   unspecified fields default to `false` (opt-in when provided).
 *
 * This is the opposite of the profile include pattern — digital assets default to
 * fetch-everything for a richer out-of-the-box experience.
 *
 * @example
 * ```ts
 * // Fetch everything (default)
 * useDigitalAsset({ address: '0x...' });
 *
 * // Fetch only name, symbol, and token type
 * useDigitalAsset({ address: '0x...', include: { name: true, symbol: true, tokenType: true } });
 * ```
 */
export const DigitalAssetIncludeSchema = z.object({
  /** Include token name */
  name: z.boolean().optional(),
  /** Include token symbol */
  symbol: z.boolean().optional(),
  /** Include token type (TOKEN/NFT/COLLECTION) */
  tokenType: z.boolean().optional(),
  /** Include decimal places (LSP7 only) */
  decimals: z.boolean().optional(),
  /** Include total supply */
  totalSupply: z.boolean().optional(),
  /** Include description from LSP4 metadata */
  description: z.boolean().optional(),
  /** Include category from LSP4 metadata */
  category: z.boolean().optional(),
  /** Include icon images from LSP4 metadata */
  icons: z.boolean().optional(),
  /** Include gallery images from LSP4 metadata */
  images: z.boolean().optional(),
  /** Include external links from LSP4 metadata */
  links: z.boolean().optional(),
  /** Include NFT metadata attributes */
  attributes: z.boolean().optional(),
  /** Include contract owner (controller) */
  owner: z.boolean().optional(),
  /** Include unique holder count aggregate */
  holderCount: z.boolean().optional(),
  /** Include creator count */
  creatorCount: z.boolean().optional(),
  /** Include LSP8 reference contract address */
  referenceContract: z.boolean().optional(),
  /** Include LSP8 token ID format */
  tokenIdFormat: z.boolean().optional(),
  /** Include LSP8 token metadata base URI */
  baseUri: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/** Zod schema for `useDigitalAsset` hook parameters — validates address and optional include config. */
export const UseDigitalAssetParamsSchema = z.object({
  /** The digital asset contract address to fetch */
  address: z.string(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

/** Zod schema for `useDigitalAssets` hook parameters — validates filter, sort, pagination, and include. */
export const UseDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Maximum number of assets to return */
  limit: z.number().optional(),
  /** Number of assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

/** Zod schema for `useInfiniteDigitalAssets` hook parameters — validates filter, sort, page size, and include. */
export const UseInfiniteDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Number of assets per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: DigitalAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

/** LSP7/LSP8 standard derived from decimals — `'LSP7'` or `'LSP8'`. See {@link StandardSchema}. */
export type Standard = z.infer<typeof StandardSchema>;
/** Token type — `'TOKEN'`, `'NFT'`, or `'COLLECTION'`. See {@link TokenTypeSchema}. */
export type TokenType = z.infer<typeof TokenTypeSchema>;
/** Digital asset contract owner (controller). See {@link DigitalAssetOwnerSchema}. */
export type DigitalAssetOwner = z.infer<typeof DigitalAssetOwnerSchema>;
/** Clean camelCase digital asset after parsing from Hasura. See {@link DigitalAssetSchema}. */
export type DigitalAsset = z.infer<typeof DigitalAssetSchema>;
/** Digital asset query filter parameters. See {@link DigitalAssetFilterSchema}. */
export type DigitalAssetFilter = z.infer<typeof DigitalAssetFilterSchema>;
/** Available fields for sorting digital assets. See {@link DigitalAssetSortFieldSchema}. */
export type DigitalAssetSortField = z.infer<typeof DigitalAssetSortFieldSchema>;
/** Digital asset sort configuration. See {@link DigitalAssetSortSchema}. */
export type DigitalAssetSort = z.infer<typeof DigitalAssetSortSchema>;
/** Field inclusion config for digital asset queries. See {@link DigitalAssetIncludeSchema}. */
export type DigitalAssetInclude = z.infer<typeof DigitalAssetIncludeSchema>;
/** Parameters for the `useDigitalAsset` hook. See {@link UseDigitalAssetParamsSchema}. */
export type UseDigitalAssetParams = z.infer<typeof UseDigitalAssetParamsSchema>;
/** Parameters for the `useDigitalAssets` hook. See {@link UseDigitalAssetsParamsSchema}. */
export type UseDigitalAssetsParams = z.infer<typeof UseDigitalAssetsParamsSchema>;
/** Parameters for the `useInfiniteDigitalAssets` hook. See {@link UseInfiniteDigitalAssetsParamsSchema}. */
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
