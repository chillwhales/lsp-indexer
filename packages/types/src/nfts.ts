import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

export const NftSchema = z.object({
  /** Collection contract address (the LSP8 / ERC721 contract) */
  address: z.string(),
  /** Token ID within the collection (string — may be large hex value) */
  tokenId: z.string(),
  /** Formatted / human-readable token ID, or `null` if unavailable */
  tokenIdFormat: z.string().nullable(),
  /** Whether this token has been burned */
  isBurned: z.boolean(),
  /** Whether this token has been minted */
  isMinted: z.boolean(),
  /** LSP4 token name from the collection's digital asset metadata, or `null` */
  name: z.string().nullable(),
  /** LSP4 token symbol from the collection's digital asset metadata, or `null` */
  symbol: z.string().nullable(),
  /** Base URI for token metadata (LSP8), or `null` */
  baseUri: z.string().nullable(),
  /** Current owner address (Universal Profile), or `null` if not owned */
  ownerAddress: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const NftFilterSchema = z.object({
  /** Filter by collection contract address (case-insensitive) */
  collectionAddress: z.string().optional(),
  /** Filter by current owner address (case-insensitive) */
  ownerAddress: z.string().optional(),
  /** Filter by token ID (case-insensitive) */
  tokenId: z.string().optional(),
});

/** Fields available for sorting NFT lists */
export const NftSortFieldSchema = z.enum(['tokenId', 'name']);

export const NftSortSchema = z.object({
  /** Which field to sort by */
  field: NftSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseNftParamsSchema = z.object({
  /** Collection contract address */
  address: z.string(),
  /** Token ID within the collection */
  tokenId: z.string(),
});

export const UseNftsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: NftFilterSchema.optional(),
  /** Sort order for results */
  sort: NftSortSchema.optional(),
  /** Maximum number of NFTs to return */
  limit: z.number().optional(),
  /** Number of NFTs to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteNftsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: NftFilterSchema.optional(),
  /** Sort order for results */
  sort: NftSortSchema.optional(),
  /** Number of NFTs per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type Nft = z.infer<typeof NftSchema>;
export type NftFilter = z.infer<typeof NftFilterSchema>;
export type NftSort = z.infer<typeof NftSortSchema>;
export type NftSortField = z.infer<typeof NftSortFieldSchema>;
export type UseNftParams = z.infer<typeof UseNftParamsSchema>;
export type UseNftsParams = z.infer<typeof UseNftsParamsSchema>;
export type UseInfiniteNftsParams = z.infer<typeof UseInfiniteNftsParamsSchema>;
