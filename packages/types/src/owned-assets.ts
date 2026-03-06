import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
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
  type Profile,
  type ProfileInclude,
  type ProfileResult,
} from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/**
 * LSP7 fungible token ownership — how much of a token an address holds.
 * Renamed from Hasura: `address` → `digitalAssetAddress`, `owner` → `holderAddress`.
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

/** `digitalAssetName` and `tokenIdCount` are nested sorts handled at service layer. */
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
  field: OwnedAssetSortFieldSchema,
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

/** Omit = fetch all fields; set individual fields to opt-in. */
export const OwnedAssetIncludeSchema = z.object({
  /** Include token balance */
  balance: z.boolean().optional(),
  /** Include block number */
  block: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include related digital asset details — `true` for all fields, or object for per-field control */
  digitalAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
  /** Include related holder profile details — `true` for all fields, or object for per-field control */
  holder: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
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
// Inferred types
// ---------------------------------------------------------------------------

export type OwnedAsset = z.infer<typeof OwnedAssetSchema>;
export type OwnedAssetFilter = z.infer<typeof OwnedAssetFilterSchema>;
export type OwnedAssetSortField = z.infer<typeof OwnedAssetSortFieldSchema>;
export type OwnedAssetSort = z.infer<typeof OwnedAssetSortSchema>;
export type OwnedAssetInclude = z.infer<typeof OwnedAssetIncludeSchema>;
export type UseOwnedAssetParams = z.infer<typeof UseOwnedAssetParamsSchema>;
export type UseOwnedAssetsParams = z.infer<typeof UseOwnedAssetsParamsSchema>;
export type UseInfiniteOwnedAssetsParams = z.infer<typeof UseInfiniteOwnedAssetsParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar include fields (non-relation): include schema key → OwnedAsset field name.
 * Relations (digitalAsset, holder) are handled separately by resolver types.
 */
type OwnedAssetScalarIncludeFieldMap = {
  balance: 'balance';
  block: 'block';
  timestamp: 'timestamp';
  tokenIdCount: 'tokenIdCount';
};

/**
 * Resolve the nested `digitalAsset` relation based on the include parameter.
 *
 * When `include` has `digitalAsset` as a `DigitalAssetInclude` object, the digitalAsset
 * field is present and narrowed by the sub-include. Otherwise, it's absent from the type.
 */
type ResolveOwnedAssetDA<I> = I extends { digitalAsset: infer C }
  ? C extends true
    ? { digitalAsset: DigitalAsset | null }
    : C extends DigitalAssetInclude
      ? { digitalAsset: DigitalAssetResult<C> | null }
      : {}
  : {};

/**
 * Resolve the nested `holder` relation based on the include parameter.
 *
 * When `include` has `holder` as a `ProfileInclude` object, the holder field is
 * present with narrowed profile fields. Otherwise, it's absent from the type.
 *
 * OwnedAsset holder is a plain Profile (no timestamp merge like NftHolder).
 */
type ResolveOwnedAssetHolder<I> = I extends { holder: infer H }
  ? H extends true
    ? { holder: Profile | null }
    : H extends ProfileInclude
      ? { holder: ProfileResult<H> | null }
      : {}
  : {};

/**
 * OwnedAsset type narrowed by include parameter.
 *
 * - `OwnedAssetResult` (no generic) → full `OwnedAsset` type (backward compatible)
 * - `OwnedAssetResult<{}>` → `{ id; digitalAssetAddress; holderAddress }` (base fields only)
 * - `OwnedAssetResult<{ balance: true }>` → base fields + balance
 * - `OwnedAssetResult<{ digitalAsset: { name: true } }>` → base fields + narrowed digitalAsset
 * - `OwnedAssetResult<{ holder: { name: true } }>` → base fields + narrowed holder
 *
 * @example
 * ```ts
 * type Full = OwnedAssetResult;                                          // = OwnedAsset (all fields)
 * type Minimal = OwnedAssetResult<{}>;                                   // = { id; digitalAssetAddress; holderAddress }
 * type WithDA = OwnedAssetResult<{ digitalAsset: { name: true } }>;      // = base + { digitalAsset: { address; name } | null }
 * ```
 */
export type OwnedAssetResult<I extends OwnedAssetInclude | undefined = undefined> =
  I extends undefined
    ? OwnedAsset
    : IncludeResult<
        OwnedAsset,
        'id' | 'digitalAssetAddress' | 'holderAddress',
        OwnedAssetScalarIncludeFieldMap,
        I
      > &
        ResolveOwnedAssetDA<NonNullable<I>> &
        ResolveOwnedAssetHolder<NonNullable<I>>;

/**
 * OwnedAsset with only base fields guaranteed — used for functions that accept
 * any include-narrowed owned asset. All non-base fields are optional.
 *
 * Equivalent to `PartialExcept<OwnedAsset, 'id' | 'digitalAssetAddress' | 'holderAddress'>`.
 */
export type PartialOwnedAsset = PartialExcept<
  OwnedAsset,
  'id' | 'digitalAssetAddress' | 'holderAddress'
>;
