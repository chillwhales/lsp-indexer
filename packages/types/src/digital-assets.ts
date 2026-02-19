import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

export const DigitalAssetSchema = z.object({
  /** The digital asset contract address (checksummed or lowercase hex) */
  address: z.string(),
  /** LSP4 token name, or `null` if not set */
  name: z.string().nullable(),
  /** LSP4 token symbol, or `null` if not set */
  symbol: z.string().nullable(),
  /** Token type: "0" (Token/LSP7), "1" (NFT/LSP8), "2" (Collection/LSP8), or `null` if not set */
  tokenType: z.string().nullable(),
  /** Total supply as string (large number), or `null` if not available */
  totalSupply: z.string().nullable(),
  /** Number of creators listed in LSP4 metadata */
  creatorCount: z.number(),
  /** Number of token holders (owned token records) */
  holderCount: z.number(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const DigitalAssetFilterSchema = z.object({
  /** Case-insensitive partial match on token name */
  name: z.string().optional(),
  /** Case-insensitive partial match on token symbol */
  symbol: z.string().optional(),
  /** Exact match on token type: "0" (Token/LSP7), "1" (NFT/LSP8), "2" (Collection/LSP8) */
  tokenType: z.string().optional(),
  /** Filter by creator address (case-insensitive) */
  creatorAddress: z.string().optional(),
});

/** Fields available for sorting digital asset lists */
export const DigitalAssetSortFieldSchema = z.enum([
  'name',
  'symbol',
  'holderCount',
  'creatorCount',
]);

export const DigitalAssetSortSchema = z.object({
  /** Which field to sort by */
  field: DigitalAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseDigitalAssetParamsSchema = z.object({
  /** The digital asset contract address to fetch */
  address: z.string(),
});

export const UseDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Maximum number of digital assets to return */
  limit: z.number().optional(),
  /** Number of digital assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteDigitalAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: DigitalAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: DigitalAssetSortSchema.optional(),
  /** Number of digital assets per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type DigitalAsset = z.infer<typeof DigitalAssetSchema>;
export type DigitalAssetFilter = z.infer<typeof DigitalAssetFilterSchema>;
export type DigitalAssetSort = z.infer<typeof DigitalAssetSortSchema>;
export type DigitalAssetSortField = z.infer<typeof DigitalAssetSortFieldSchema>;
export type UseDigitalAssetParams = z.infer<typeof UseDigitalAssetParamsSchema>;
export type UseDigitalAssetsParams = z.infer<typeof UseDigitalAssetsParamsSchema>;
export type UseInfiniteDigitalAssetsParams = z.infer<typeof UseInfiniteDigitalAssetsParamsSchema>;
