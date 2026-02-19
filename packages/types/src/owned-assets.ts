import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Owned asset (LSP7 fungible token) — represents a Universal Profile's
 * ownership of a fungible token balance.
 */
export const OwnedAssetSchema = z.object({
  /** UP address that owns the token */
  ownerAddress: z.string(),
  /** Token contract address */
  assetAddress: z.string(),
  /** Token balance as string (handles large numbers beyond Number.MAX_SAFE_INTEGER) */
  balance: z.string().nullable(),
  /** LSP4 token name, or `null` if not set */
  name: z.string().nullable(),
  /** LSP4 token symbol, or `null` if not set */
  symbol: z.string().nullable(),
});

/**
 * Owned token (LSP8 non-fungible token) — represents a Universal Profile's
 * ownership of a specific NFT by token ID.
 */
export const OwnedTokenSchema = z.object({
  /** UP address that owns the NFT */
  ownerAddress: z.string(),
  /** Collection contract address */
  assetAddress: z.string(),
  /** Specific token ID within the collection */
  tokenId: z.string(),
  /** LSP4 token name, or `null` if not set */
  name: z.string().nullable(),
  /** LSP4 token symbol, or `null` if not set */
  symbol: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

export const OwnedAssetFilterSchema = z.object({
  /** Filter by owner UP address (case-insensitive) */
  ownerAddress: z.string().optional(),
  /** Filter by token contract address (case-insensitive) */
  assetAddress: z.string().optional(),
});

export const OwnedTokenFilterSchema = z.object({
  /** Filter by owner UP address (case-insensitive) */
  ownerAddress: z.string().optional(),
  /** Filter by collection contract address (case-insensitive) */
  assetAddress: z.string().optional(),
  /** Filter by specific token ID (case-insensitive) */
  tokenId: z.string().optional(),
});

/** Fields available for sorting owned asset lists */
export const OwnedAssetSortFieldSchema = z.enum(['assetAddress', 'balance']);

/** Fields available for sorting owned token lists */
export const OwnedTokenSortFieldSchema = z.enum(['assetAddress', 'tokenId']);

export const OwnedAssetSortSchema = z.object({
  /** Which field to sort by */
  field: OwnedAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

export const OwnedTokenSortSchema = z.object({
  /** Which field to sort by */
  field: OwnedTokenSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseOwnedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedAssetSortSchema.optional(),
  /** Maximum number of owned assets to return */
  limit: z.number().optional(),
  /** Number of owned assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteOwnedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedAssetSortSchema.optional(),
  /** Number of owned assets per page (default: 20) */
  pageSize: z.number().optional(),
});

export const UseOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Maximum number of owned tokens to return */
  limit: z.number().optional(),
  /** Number of owned tokens to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Number of owned tokens per page (default: 20) */
  pageSize: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type OwnedAsset = z.infer<typeof OwnedAssetSchema>;
export type OwnedToken = z.infer<typeof OwnedTokenSchema>;
export type OwnedAssetFilter = z.infer<typeof OwnedAssetFilterSchema>;
export type OwnedTokenFilter = z.infer<typeof OwnedTokenFilterSchema>;
export type OwnedAssetSort = z.infer<typeof OwnedAssetSortSchema>;
export type OwnedTokenSort = z.infer<typeof OwnedTokenSortSchema>;
export type OwnedAssetSortField = z.infer<typeof OwnedAssetSortFieldSchema>;
export type OwnedTokenSortField = z.infer<typeof OwnedTokenSortFieldSchema>;
export type UseOwnedAssetsParams = z.infer<typeof UseOwnedAssetsParamsSchema>;
export type UseInfiniteOwnedAssetsParams = z.infer<typeof UseInfiniteOwnedAssetsParamsSchema>;
export type UseOwnedTokensParams = z.infer<typeof UseOwnedTokensParamsSchema>;
export type UseInfiniteOwnedTokensParams = z.infer<typeof UseInfiniteOwnedTokensParamsSchema>;
