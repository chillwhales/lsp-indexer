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

/** LSP12 issued asset — one per unique issuer↔digital-asset pair. */
export const IssuedAssetSchema = z.object({
  /** Address that issued the digital asset (always present) */
  issuerAddress: z.string(),
  /** Digital asset contract address (always present) */
  assetAddress: z.string(),
  /** Position in the LSP12 issued assets array (null = not included or not set) */
  arrayIndex: z.number().nullable(),
  /** ERC165 interface ID (null = not included or not set) */
  interfaceId: z.string().nullable(),
  /** Timestamp when indexed (ISO string) */
  timestamp: z.string().nullable(),
  /** Universal Profile of the issuer (null = not included in query) */
  issuerProfile: ProfileSchema.nullable(),
  /** Digital asset details (null = not included in query) */
  digitalAsset: DigitalAssetSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

export const IssuedAssetFilterSchema = z.object({
  /** Case-insensitive match on issuer address */
  issuerAddress: z.string().optional(),
  /** Case-insensitive match on digital asset address */
  assetAddress: z.string().optional(),
  /** Case-insensitive match on interface ID */
  interfaceId: z.string().optional(),
  /** Case-insensitive match on issuer's profile name (nested via universalProfile.lsp3Profile.name) */
  issuerName: z.string().optional(),
  /** Case-insensitive match on digital asset name (nested via issuedAsset.lsp4TokenName.value) */
  digitalAssetName: z.string().optional(),
  /** ISO timestamp or unix seconds lower bound (inclusive) */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** ISO timestamp or unix seconds upper bound (inclusive) */
  timestampTo: z.union([z.string(), z.number()]).optional(),
});

// ---------------------------------------------------------------------------
// Sort schema
// ---------------------------------------------------------------------------

/** `issuerName` / `digitalAssetName` are nested sorts handled at service layer. */
export const IssuedAssetSortFieldSchema = z.enum([
  'timestamp',
  'issuerAddress',
  'assetAddress',
  'arrayIndex',
  'issuerName',
  'digitalAssetName',
]);

export const IssuedAssetSortSchema = z.object({
  field: IssuedAssetSortFieldSchema,
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema
// ---------------------------------------------------------------------------

/** Omit = fetch all fields; set individual fields to opt-in. */
export const IssuedAssetIncludeSchema = z.object({
  /** Include array index position */
  arrayIndex: z.boolean().optional(),
  /** Include ERC165 interface ID */
  interfaceId: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include issuer's Universal Profile — `true` for all fields, or object for per-field control */
  issuerProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include digital asset details — `true` for all fields, or object for per-field control */
  digitalAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 2 hooks
// ---------------------------------------------------------------------------

/** Params for useIssuedAssets — paginated list of issued assets */
export const UseIssuedAssetsParamsSchema = z.object({
  filter: IssuedAssetFilterSchema.optional(),
  sort: IssuedAssetSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: IssuedAssetIncludeSchema.optional(),
});

/** Params for useInfiniteIssuedAssets — infinite scroll variant */
export const UseInfiniteIssuedAssetsParamsSchema = z.object({
  filter: IssuedAssetFilterSchema.optional(),
  sort: IssuedAssetSortSchema.optional(),
  pageSize: z.number().optional(),
  include: IssuedAssetIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type IssuedAsset = z.infer<typeof IssuedAssetSchema>;
export type IssuedAssetFilter = z.infer<typeof IssuedAssetFilterSchema>;
export type IssuedAssetSortField = z.infer<typeof IssuedAssetSortFieldSchema>;
export type IssuedAssetSort = z.infer<typeof IssuedAssetSortSchema>;
export type IssuedAssetInclude = z.infer<typeof IssuedAssetIncludeSchema>;
export type UseIssuedAssetsParams = z.infer<typeof UseIssuedAssetsParamsSchema>;
export type UseInfiniteIssuedAssetsParams = z.infer<typeof UseInfiniteIssuedAssetsParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → IssuedAsset field name.
 * Relations (issuerProfile, digitalAsset) handled by resolver types.
 */
type IssuedAssetScalarIncludeFieldMap = {
  arrayIndex: 'arrayIndex';
  interfaceId: 'interfaceId';
  timestamp: 'timestamp';
};

/**
 * Resolve nested `issuerProfile` relation based on include parameter.
 * When include has `issuerProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveIssuerProfile<I> = I extends { issuerProfile: infer P }
  ? P extends true
    ? { issuerProfile: Profile | null }
    : P extends ProfileInclude
      ? { issuerProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `digitalAsset` relation based on include parameter.
 * When include has `digitalAsset` as a DigitalAssetInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveIssuedAssetDigitalAsset<I> = I extends { digitalAsset: infer D }
  ? D extends true
    ? { digitalAsset: DigitalAsset | null }
    : D extends DigitalAssetInclude
      ? { digitalAsset: DigitalAssetResult<D> | null }
      : {}
  : {};

/**
 * IssuedAsset type narrowed by include parameter.
 *
 * - `IssuedAssetResult` (no generic) → full `IssuedAsset` type (backward compatible)
 * - `IssuedAssetResult<{}>` → `{ issuerAddress; assetAddress }` (base fields only)
 * - `IssuedAssetResult<{ timestamp: true }>` → base + timestamp
 * - `IssuedAssetResult<{ issuerProfile: { name: true } }>` → base + narrowed issuer profile
 * - `IssuedAssetResult<{ digitalAsset: { name: true, symbol: true } }>` → base + narrowed digital asset
 *
 * @example
 * ```ts
 * type Full = IssuedAssetResult;                                           // = IssuedAsset (all fields)
 * type Minimal = IssuedAssetResult<{}>;                                    // = { issuerAddress; assetAddress }
 * type WithTime = IssuedAssetResult<{ timestamp: true }>;                  // = base + timestamp
 * type WithProf = IssuedAssetResult<{ issuerProfile: { name: true } }>;    // = base + narrowed profile
 * type WithDA = IssuedAssetResult<{ digitalAsset: { name: true } }>;       // = base + narrowed DA
 * ```
 */
export type IssuedAssetResult<I extends IssuedAssetInclude | undefined = undefined> =
  I extends undefined
    ? IssuedAsset
    : IncludeResult<
        IssuedAsset,
        'issuerAddress' | 'assetAddress',
        IssuedAssetScalarIncludeFieldMap,
        I
      > &
        ResolveIssuerProfile<NonNullable<I>> &
        ResolveIssuedAssetDigitalAsset<NonNullable<I>>;

/**
 * IssuedAsset with only base fields guaranteed — used for components that accept
 * any include-narrowed IssuedAsset.
 */
export type PartialIssuedAsset = PartialExcept<IssuedAsset, 'issuerAddress' | 'assetAddress'>;
