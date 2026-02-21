import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
import { DigitalAssetIncludeSchema, DigitalAssetSchema } from './digital-assets';
import { ProfileIncludeSchema, ProfileSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * Owned Asset — represents LSP7 fungible token ownership.
 *
 * Each record represents how much of a particular token an address holds.
 * The `balance` field uses `bigint` for uint256 precision (per locked decision).
 *
 * Fields renamed for developer clarity:
 * - `digitalAssetAddress` (Hasura: `address`) — the asset contract address
 * - `holderAddress` (Hasura: `owner`) — the holder's address
 * - `holder` (Hasura: `universalProfile`) — the holder's profile
 */
export const OwnedAssetSchema = z.object({
  /** Unique identifier */
  id: z.string(),
  /** Asset contract address (Hasura column: address) */
  digitalAssetAddress: z.string(),
  /** Holder address (Hasura column: owner) */
  holderAddress: z.string(),
  /** Token balance — bigint for uint256 precision (null when excluded via include) */
  balance: z.bigint().nullable(),
  /** Block number when this ownership was last updated (null when excluded via include) */
  block: z.number().nullable(),
  /** Timestamp when this ownership was last updated — ISO string (null when excluded via include) */
  timestamp: z.string().nullable(),
  /** Related digital asset details (null = not included in query) */
  digitalAsset: DigitalAssetSchema.nullable(),
  /** Related holder's universal profile details (null = not included in query) */
  holder: ProfileSchema.nullable(),
  /** Count of individual tokens (LSP8 token IDs) within this ownership, null if not included */
  tokenIdCount: z.number().nullable(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/**
 * Filter criteria for owned asset queries.
 *
 * All string fields use case-insensitive `_ilike` matching at the service layer.
 * Name filters use nested relation filtering through Hasura.
 */
export const OwnedAssetFilterSchema = z.object({
  /** Case-insensitive match on holder address (Hasura column: owner) */
  holderAddress: z.string().optional(),
  /** Case-insensitive match on asset contract address (Hasura column: address) */
  digitalAssetAddress: z.string().optional(),
  /** Case-insensitive match on the holder's profile name (via universalProfile.lsp3Profile.name) */
  holderName: z.string().optional(),
  /** Case-insensitive match on the digital asset's token name (via digitalAsset.lsp4TokenName) */
  assetName: z.string().optional(),
});

/**
 * Fields available for sorting owned asset lists.
 *
 * Direct columns: balance, timestamp, digitalAssetAddress, holderAddress, block.
 * Nested sorts: digitalAssetName (via digitalAsset.lsp4TokenName), tokenIdCount (via tokenIds_aggregate).
 */
export const OwnedAssetSortFieldSchema = z.enum([
  'balance',
  'timestamp',
  'digitalAssetAddress',
  'holderAddress',
  'block',
  'digitalAssetName',
  'tokenIdCount',
]);

export const OwnedAssetSortSchema = z.object({
  /** Which field to sort by */
  field: OwnedAssetSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which fields to include in an owned asset query.
 *
 * **Behavior (inverted default):**
 * - When `include` is **omitted** entirely → all fields are fetched (opt-out model).
 *   GraphQL variables default to `true`, so all `@include(if:)` directives pass.
 * - When `include` is **provided** → only fields explicitly set/provided are included;
 *   unspecified fields default to `false` (opt-in when provided).
 *
 * The `digitalAsset` field accepts a `DigitalAssetIncludeSchema` for nested 17-field
 * sub-includes — controlling exactly which digital asset attributes to fetch.
 */
export const OwnedAssetIncludeSchema = z.object({
  /** Include token balance */
  balance: z.boolean().optional(),
  /** Include block number */
  block: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include related digital asset details — sub-fields control which DA attributes to fetch */
  digitalAsset: DigitalAssetIncludeSchema.optional(),
  /** Include related holder profile details — sub-fields control which profile attributes to fetch */
  holder: ProfileIncludeSchema.optional(),
  /** Include count of individual token IDs (tokenIds_aggregate) */
  tokenIdCount: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/** Parameters for useOwnedAsset — single owned asset by unique ID */
export const UseOwnedAssetParamsSchema = z.object({
  /** Owned asset unique ID */
  id: z.string(),
  /** Control which data to include (omit for all data — inverted default) */
  include: OwnedAssetIncludeSchema.optional(),
});

/** Parameters for useOwnedAssets — paginated list with filters and sorting */
export const UseOwnedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedAssetSortSchema.optional(),
  /** Maximum number of owned assets to return */
  limit: z.number().optional(),
  /** Number of owned assets to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which data to include (omit for all data — inverted default) */
  include: OwnedAssetIncludeSchema.optional(),
});

/** Parameters for useInfiniteOwnedAssets — infinite scroll with filters and sorting */
export const UseInfiniteOwnedAssetsParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: OwnedAssetFilterSchema.optional(),
  /** Sort order for results */
  sort: OwnedAssetSortSchema.optional(),
  /** Number of owned assets per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which data to include (omit for all data — inverted default) */
  include: OwnedAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type OwnedAsset = z.infer<typeof OwnedAssetSchema>;
export type OwnedAssetFilter = z.infer<typeof OwnedAssetFilterSchema>;
export type OwnedAssetSortField = z.infer<typeof OwnedAssetSortFieldSchema>;
export type OwnedAssetSort = z.infer<typeof OwnedAssetSortSchema>;
export type OwnedAssetInclude = z.infer<typeof OwnedAssetIncludeSchema>;
export type UseOwnedAssetParams = z.infer<typeof UseOwnedAssetParamsSchema>;
export type UseOwnedAssetsParams = z.infer<typeof UseOwnedAssetsParamsSchema>;
export type UseInfiniteOwnedAssetsParams = z.infer<typeof UseInfiniteOwnedAssetsParamsSchema>;
