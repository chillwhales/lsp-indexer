import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
import { DigitalAssetIncludeSchema, DigitalAssetSchema } from './digital-assets';
import { NftIncludeSchema, NftSchema } from './nfts';
import { OwnedAssetSchema } from './owned-assets';
import { ProfileIncludeSchema, ProfileSchema } from './profiles';

/**
 * NFT sub-include schema for the owned-token context.
 *
 * Omits `collection` and `holder` because those are sibling relations on
 * owned_token itself (digitalAsset / universalProfile), not nested within
 * the NFT block. The 8 remaining fields control which NFT metadata to fetch.
 */
export const OwnedTokenNftIncludeSchema = NftIncludeSchema.omit({
  collection: true,
  holder: true,
});

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Owned Token — represents LSP8 individual NFT ownership.
 *
 * Each record represents which specific token (identified by token_id) an
 * address holds within a particular collection.
 */
export const OwnedTokenSchema = z.object({
  /** Unique identifier */
  id: z.string(),
  /** Asset contract address */
  address: z.string(),
  /** Owner address */
  owner: z.string(),
  /** Specific token ID within the collection */
  tokenId: z.string(),
  /** Block number when this ownership was last updated */
  block: z.number(),
  /** Timestamp when this ownership was last updated (ISO string) */
  timestamp: z.string(),
  /** Related digital asset (null = not included) */
  digitalAsset: DigitalAssetSchema.nullable(),
  /** Related NFT details (null = not included) */
  nft: NftSchema.nullable(),
  /** Related owned asset (parent fungible ownership record, null = not included) */
  ownedAsset: OwnedAssetSchema.nullable(),
  /** Related universal profile (null = not included) */
  universalProfile: ProfileSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/**
 * Filter criteria for owned token queries.
 *
 * All string fields use case-insensitive `_ilike` matching at the service layer.
 * Name filters use nested relation filtering through Hasura.
 */
export const OwnedTokenFilterSchema = z.object({
  /** Case-insensitive match on holder (owner) address */
  owner: z.string().optional(),
  /** Case-insensitive match on asset contract address */
  address: z.string().optional(),
  /** Case-insensitive match on token ID */
  tokenId: z.string().optional(),
  /** Case-insensitive match on the digital asset's token name (via digitalAsset.lsp4TokenName) */
  assetName: z.string().optional(),
  /** Case-insensitive match on the NFT's name (via nft.lsp4Metadata.name or nft.lsp4MetadataBaseUri.name) */
  tokenName: z.string().optional(),
});

/** Fields available for sorting owned token lists */
export const OwnedTokenSortFieldSchema = z.enum([
  'address',
  'block',
  'owner',
  'timestamp',
  'tokenId',
]);

export const OwnedTokenSortSchema = z.object({
  /** Which field to sort by */
  field: OwnedTokenSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which nested fields to include in an owned token query.
 *
 * **Behavior (inverted default):**
 * - When `include` is **omitted** entirely → all fields are fetched (opt-out model).
 * - When `include` is **provided** → only fields explicitly set/provided are included.
 *
 * The `digitalAsset` field accepts a `DigitalAssetIncludeSchema` for nested 17-field
 * sub-includes — controlling exactly which digital asset attributes to fetch.
 *
 * The `nft` field accepts an `OwnedTokenNftIncludeSchema` (NftInclude minus collection/holder)
 * for nested 8-field sub-includes — controlling exactly which NFT metadata to fetch.
 */
export const OwnedTokenIncludeSchema = z.object({
  /** Include related digital asset details — sub-fields control which DA attributes to fetch */
  digitalAsset: DigitalAssetIncludeSchema.optional(),
  /** Include related NFT details — sub-fields control which NFT metadata to fetch */
  nft: OwnedTokenNftIncludeSchema.optional(),
  /** Include related owned asset (parent fungible ownership record) */
  ownedAsset: z.boolean().optional(),
  /** Include related universal profile details — sub-fields control which profile attributes to fetch */
  universalProfile: ProfileIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/** Parameters for useOwnedToken — single owned token by unique ID */
export const UseOwnedTokenParamsSchema = z.object({
  /** Owned token unique ID */
  id: z.string(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

/** Parameters for useOwnedTokens — paginated list with filters and sorting */
export const UseOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Maximum number of owned tokens to return */
  limit: z.number().optional(),
  /** Number of owned tokens to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

/** Parameters for useInfiniteOwnedTokens — infinite scroll with filters and sorting */
export const UseInfiniteOwnedTokensParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedTokenFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedTokenSortSchema.optional(),
  /** Number of owned tokens per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data — inverted default) */
  include: OwnedTokenIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type OwnedToken = z.infer<typeof OwnedTokenSchema>;
export type OwnedTokenFilter = z.infer<typeof OwnedTokenFilterSchema>;
export type OwnedTokenSortField = z.infer<typeof OwnedTokenSortFieldSchema>;
export type OwnedTokenSort = z.infer<typeof OwnedTokenSortSchema>;
export type OwnedTokenInclude = z.infer<typeof OwnedTokenIncludeSchema>;
export type OwnedTokenNftInclude = z.infer<typeof OwnedTokenNftIncludeSchema>;
export type UseOwnedTokenParams = z.infer<typeof UseOwnedTokenParamsSchema>;
export type UseOwnedTokensParams = z.infer<typeof UseOwnedTokensParamsSchema>;
export type UseInfiniteOwnedTokensParams = z.infer<typeof UseInfiniteOwnedTokensParamsSchema>;
