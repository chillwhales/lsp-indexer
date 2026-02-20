import { z } from 'zod';

import {
  Lsp4AttributeSchema,
  Lsp4ImageSchema,
  Lsp4LinkSchema,
  SortDirectionSchema,
  SortNullsSchema,
} from './common';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** Owner of an individual NFT token (from owned_token table) */
export const NftOwnerSchema = z.object({
  /** Current holder address */
  address: z.string(),
  /** When this holder acquired the token (ISO timestamp) */
  timestamp: z.string(),
});

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
  /** Parent collection name (from digital_asset.lsp4TokenName) */
  collectionName: z.string().nullable(),
  /** Parent collection symbol (from digital_asset.lsp4TokenSymbol) */
  collectionSymbol: z.string().nullable(),
  /** Current token owner (from owned_token relation) */
  owner: NftOwnerSchema.nullable(),
  /** NFT-specific metadata description */
  description: z.string().nullable(),
  /** NFT-specific metadata category */
  category: z.string().nullable(),
  /** NFT-specific metadata icon images */
  icons: z.array(Lsp4ImageSchema).nullable(),
  /** NFT-specific metadata images */
  images: z.array(Lsp4ImageSchema).nullable(),
  /** NFT-specific metadata links */
  links: z.array(Lsp4LinkSchema).nullable(),
  /** NFT-specific metadata attributes (traits) */
  attributes: z.array(Lsp4AttributeSchema).nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

/**
 * Filter for NFT queries.
 *
 * `collectionAddress` enables the `useNftsByCollection` pattern from QUERY-03.
 */
export const NftFilterSchema = z.object({
  /** Case-insensitive match on collection contract address — key filter for useNftsByCollection */
  collectionAddress: z.string().optional(),
  /** Case-insensitive match on token ID */
  tokenId: z.string().optional(),
  /** Case-insensitive match on current owner address */
  ownerAddress: z.string().optional(),
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
 */
export const NftIncludeSchema = z.object({
  /** Include human-readable formatted token ID */
  formattedTokenId: z.boolean().optional(),
  /** Include parent collection info (name, symbol) from digital_asset */
  collection: z.boolean().optional(),
  /** Include current owner data from owned_token */
  owner: z.boolean().optional(),
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

/** Parameters for useNft — single NFT by collection address + token ID */
export const UseNftParamsSchema = z.object({
  /** Collection contract address */
  address: z.string(),
  /** Token ID within the collection */
  tokenId: z.string(),
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

export type NftOwner = z.infer<typeof NftOwnerSchema>;
export type Nft = z.infer<typeof NftSchema>;
export type NftFilter = z.infer<typeof NftFilterSchema>;
export type NftSortField = z.infer<typeof NftSortFieldSchema>;
export type NftSort = z.infer<typeof NftSortSchema>;
export type NftInclude = z.infer<typeof NftIncludeSchema>;
export type UseNftParams = z.infer<typeof UseNftParamsSchema>;
export type UseNftsParams = z.infer<typeof UseNftsParamsSchema>;
export type UseInfiniteNftsParams = z.infer<typeof UseInfiniteNftsParamsSchema>;
