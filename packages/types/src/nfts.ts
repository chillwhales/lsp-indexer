import { z } from 'zod';

import {
  ImageSchema,
  LinkSchema,
  Lsp4AttributeSchema,
  SortDirectionSchema,
  SortNullsSchema,
} from './common';
import {
  DigitalAssetIncludeSchema,
  DigitalAssetSchema,
  type DigitalAsset,
  type DigitalAssetInclude,
  type DigitalAssetResult,
} from './digital-assets';
import type { IncludeResult, PartialExcept } from './include-types';
import {
  ProfileIncludeSchema,
  ProfileSchema,
  type ProfileInclude,
  type ProfileResult,
} from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Holder of an individual NFT token (from owned_token table).
 *
 * Profile fields are spread flat into the holder object — the `universalProfile`
 * Hasura relation is merged, not nested. When the holder has no UP, profile
 * fields will be `null` / `0` / `[]`.
 */
export const NftHolderSchema = z
  .object({
    /** When this holder acquired the token (ISO timestamp) */
    timestamp: z.string(),
  })
  .merge(ProfileSchema);

/**
 * Individual NFT token within an LSP8 collection.
 *
 * Identified by (address, tokenId) pair where `address` is the collection
 * contract address and `tokenId` is the specific token within that collection.
 */
export const NftSchema = z.object({
  /** Collection contract address — always present */
  address: z.string(),
  /** Token ID within the collection — always present */
  tokenId: z.string(),
  /** Human-readable formatted token ID */
  formattedTokenId: z.string().nullable(),
  /** Whether the token has been burned */
  isBurned: z.boolean(),
  /** Whether the token has been minted */
  isMinted: z.boolean(),
  /** NFT's own name from lsp4Metadata.name (direct metadata first, baseUri fallback) */
  name: z.string().nullable(),
  /** Parent collection as full DigitalAsset (from digitalAsset relation) */
  collection: DigitalAssetSchema.nullable(),
  /** Current token holder (from owned_token relation) */
  holder: NftHolderSchema.nullable(),
  /** NFT-specific metadata description */
  description: z.string().nullable(),
  /** NFT-specific metadata category */
  category: z.string().nullable(),
  /** NFT-specific metadata icon images */
  icons: z.array(ImageSchema).nullable(),
  /** NFT-specific metadata images grouped by image_index */
  images: z.array(z.array(ImageSchema)).nullable(),
  /** NFT-specific metadata links */
  links: z.array(LinkSchema).nullable(),
  /** NFT-specific metadata attributes (traits) */
  attributes: z.array(Lsp4AttributeSchema).nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

/**
 * Filter for NFT queries.
 *
 * `collectionAddress` enables the `useNftsByCollection` pattern (filter NFTs by collection).
 */
export const NftFilterSchema = z.object({
  /** Case-insensitive match on collection contract address — key filter for useNftsByCollection */
  collectionAddress: z.string().optional(),
  /** Case-insensitive match on token ID */
  tokenId: z.string().optional(),
  /** Case-insensitive match on formatted token ID */
  formattedTokenId: z.string().optional(),
  /** Case-insensitive match on NFT name (searches both direct and baseUri metadata) */
  name: z.string().optional(),
  /** Case-insensitive match on current holder address */
  holderAddress: z.string().optional(),
  /** Filter by burned status */
  isBurned: z.boolean().optional(),
  /** Filter by minted status */
  isMinted: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Sort schema
// ---------------------------------------------------------------------------

/** Fields available for sorting NFT lists */
export const NftSortFieldSchema = z.enum(['tokenId', 'formattedTokenId']);

/** Zod schema for NFT sort configuration — validates field, direction, and null ordering. */
export const NftSortSchema = z.object({
  /** Which field to sort by */
  field: NftSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema (inverted default — omit = fetch everything)
// ---------------------------------------------------------------------------

/**
 * Controls which optional fields are fetched for NFT queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` are included.
 *
 * **Collection sub-includes:** When `collection` is provided (even as `{}`),
 * the collection data is included. The sub-fields within `collection` control
 * which collection attributes to fetch (using DigitalAssetIncludeSchema).
 */
export const NftIncludeSchema = z.object({
  /** Include human-readable formatted token ID */
  formattedTokenId: z.boolean().optional(),
  /** Include NFT's own name from metadata */
  name: z.boolean().optional(),
  /** Include parent collection as full DigitalAsset — `true` for all fields, or object for per-field control */
  collection: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
  /** Include current holder data from owned_token — `true` for all fields, or object for per-field control */
  holder: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include metadata description */
  description: z.boolean().optional(),
  /** Include metadata category */
  category: z.boolean().optional(),
  /** Include metadata icon images */
  icons: z.boolean().optional(),
  /** Include metadata images */
  images: z.boolean().optional(),
  /** Include metadata links */
  links: z.boolean().optional(),
  /** Include metadata attributes (traits) */
  attributes: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/**
 * Parameters for useNft — single NFT by collection address + token ID or formatted token ID.
 *
 * At least one of `tokenId` or `formattedTokenId` is required (enforced at service level).
 */
export const UseNftParamsSchema = z.object({
  /** Collection contract address */
  address: z.string(),
  /** Token ID within the collection (either this or formattedTokenId required) */
  tokenId: z.string().optional(),
  /** Formatted token ID (either this or tokenId required) */
  formattedTokenId: z.string().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: NftIncludeSchema.optional(),
});

/** Parameters for useNfts — paginated list with filters and sorting */
export const UseNftsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: NftFilterSchema.optional(),
  /** Sort order for results */
  sort: NftSortSchema.optional(),
  /** Maximum number of NFTs to return */
  limit: z.number().optional(),
  /** Number of NFTs to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: NftIncludeSchema.optional(),
});

/** Parameters for useInfiniteNfts — infinite scroll with filters and sorting */
export const UseInfiniteNftsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: NftFilterSchema.optional(),
  /** Sort order for results */
  sort: NftSortSchema.optional(),
  /** Number of NFTs per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: NftIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

/** NFT holder (current token possessor) with profile and timestamp. See {@link NftHolderSchema}. */
export type NftHolder = z.infer<typeof NftHolderSchema>;
/** Clean camelCase NFT after parsing from Hasura. See {@link NftSchema}. */
export type Nft = z.infer<typeof NftSchema>;
/** NFT query filter parameters. See {@link NftFilterSchema}. */
export type NftFilter = z.infer<typeof NftFilterSchema>;
/** Available fields for sorting NFTs. See {@link NftSortFieldSchema}. */
export type NftSortField = z.infer<typeof NftSortFieldSchema>;
/** NFT sort configuration. See {@link NftSortSchema}. */
export type NftSort = z.infer<typeof NftSortSchema>;
/** Field inclusion config for NFT queries. See {@link NftIncludeSchema}. */
export type NftInclude = z.infer<typeof NftIncludeSchema>;
/** Parameters for the `useNft` hook. See {@link UseNftParamsSchema}. */
export type UseNftParams = z.infer<typeof UseNftParamsSchema>;
/** Parameters for the `useNfts` hook. See {@link UseNftsParamsSchema}. */
export type UseNftsParams = z.infer<typeof UseNftsParamsSchema>;
/** Parameters for the `useInfiniteNfts` hook. See {@link UseInfiniteNftsParamsSchema}. */
export type UseInfiniteNftsParams = z.infer<typeof UseInfiniteNftsParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar include fields (non-relation): include schema key → Nft field name.
 * Relations (collection, holder) are handled separately by resolver types.
 */
type NftScalarIncludeFieldMap = {
  formattedTokenId: 'formattedTokenId';
  name: 'name';
  description: 'description';
  category: 'category';
  icons: 'icons';
  images: 'images';
  links: 'links';
  attributes: 'attributes';
};

/**
 * Resolve the nested `collection` relation based on the include parameter.
 *
 * When `include` has `collection` as a `DigitalAssetInclude` object, the collection
 * field is present and narrowed by the sub-include. Otherwise, it's absent from the type.
 */
type ResolveNftCollection<I> = I extends { collection: infer C }
  ? C extends true
    ? { collection: DigitalAsset | null }
    : C extends DigitalAssetInclude
      ? { collection: DigitalAssetResult<C> | null }
      : {}
  : {};

/**
 * Resolve the nested `holder` relation based on the include parameter.
 *
 * When `include` has `holder` as a `ProfileInclude` object, the holder field is
 * present with narrowed profile fields + `timestamp`. Otherwise, it's absent from the type.
 *
 * NftHolder = Profile & { timestamp: string }, so the holder type is:
 * `(ProfileResult<H> & { timestamp: string }) | null`
 */
type ResolveNftHolder<I> = I extends { holder: infer H }
  ? H extends true
    ? { holder: NftHolder | null }
    : H extends ProfileInclude
      ? { holder: (ProfileResult<H> & { timestamp: string }) | null }
      : {}
  : {};

/**
 * NFT type narrowed by include parameter.
 *
 * - `NftResult` (no generic) → full `Nft` type (backward compatible)
 * - `NftResult<{}>` → `{ address; tokenId; isBurned; isMinted }` (base fields only)
 * - `NftResult<{ name: true }>` → base fields + name
 * - `NftResult<{ collection: { name: true } }>` → base fields + narrowed collection
 * - `NftResult<{ holder: { name: true } }>` → base fields + narrowed holder with timestamp
 *
 * @example
 * ```ts
 * type Full = NftResult;                                  // = Nft (all fields)
 * type Minimal = NftResult<{}>;                           // = { address; tokenId; isBurned; isMinted }
 * type WithCol = NftResult<{ collection: { name: true } }>; // = base + { collection: { address; name } | null }
 * ```
 */
export type NftResult<I extends NftInclude | undefined = undefined> = I extends undefined
  ? Nft
  : IncludeResult<
      Nft,
      'address' | 'tokenId' | 'isBurned' | 'isMinted',
      NftScalarIncludeFieldMap,
      I
    > &
      ResolveNftCollection<NonNullable<I>> &
      ResolveNftHolder<NonNullable<I>>;

/**
 * Nft with only base fields guaranteed — used for functions that accept
 * any include-narrowed NFT. All non-base fields are optional.
 *
 * Equivalent to `PartialExcept<Nft, 'address' | 'tokenId' | 'isBurned' | 'isMinted'>`.
 */
export type PartialNft = PartialExcept<Nft, 'address' | 'tokenId' | 'isBurned' | 'isMinted'>;
