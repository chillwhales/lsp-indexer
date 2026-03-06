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
 * An entry in a digital asset's LSP4 creators array.
 *
 * Represents a single record in the `lsp4_creator` Hasura table — one per
 * unique creator↔digital-asset pair. Base fields (`creatorAddress`,
 * `digitalAssetAddress`) are always present; other fields are controlled by
 * the `include` parameter.
 */
export const CreatorSchema = z.object({
  /** Address that created the digital asset (always present) */
  creatorAddress: z.string(),
  /** Digital asset contract address (always present) */
  digitalAssetAddress: z.string(),
  /** Position in the LSP4 creators array (null = not included or not set) */
  arrayIndex: z.number().nullable(),
  /** ERC165 interface ID of the creator (null = not included or not set) */
  interfaceId: z.string().nullable(),
  /** Timestamp when indexed (ISO string) */
  timestamp: z.string().nullable(),
  /** Universal Profile of the creator (null = not included in query) */
  creatorProfile: ProfileSchema.nullable(),
  /** Digital asset details (null = not included in query) */
  digitalAsset: DigitalAssetSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

/**
 * Filter for creator queries.
 *
 * All 7 filter fields from CONTEXT.md — string fields use `_ilike` (case-insensitive),
 * timestamp fields use `_gte` / `_lte` for range filtering.
 */
export const CreatorFilterSchema = z.object({
  /** Case-insensitive match on creator address */
  creatorAddress: z.string().optional(),
  /** Case-insensitive match on digital asset address */
  digitalAssetAddress: z.string().optional(),
  /** Case-insensitive match on interface ID */
  interfaceId: z.string().optional(),
  /** Case-insensitive match on creator's profile name (nested via creatorProfile.lsp3Profile.name) */
  creatorName: z.string().optional(),
  /** Case-insensitive match on digital asset name (nested via digitalAsset.lsp4TokenName.name) */
  digitalAssetName: z.string().optional(),
  /** ISO timestamp or unix seconds lower bound (inclusive) */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** ISO timestamp or unix seconds upper bound (inclusive) */
  timestampTo: z.union([z.string(), z.number()]).optional(),
});

// ---------------------------------------------------------------------------
// Sort schema
// ---------------------------------------------------------------------------

/**
 * Fields available for sorting creator lists.
 *
 * `creatorName` is a nested sort via `creatorProfile.lsp3Profile.name`.
 * `digitalAssetName` is a nested sort via `digitalAsset.lsp4TokenName.name`.
 * Both handled at service layer.
 */
export const CreatorSortFieldSchema = z.enum([
  'timestamp',
  'creatorAddress',
  'digitalAssetAddress',
  'arrayIndex',
  'creatorName',
  'digitalAssetName',
]);

/** Zod schema for creator sort configuration — validates field, direction, and null ordering. */
export const CreatorSortSchema = z.object({
  /** Which field to sort by */
  field: CreatorSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default */
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema (inverted default — omit = fetch everything)
// ---------------------------------------------------------------------------

/**
 * Controls which optional fields are fetched for creator queries.
 *
 * **Inverted default:** When `include` is omitted, ALL fields are fetched
 * (opt-out rather than opt-in). When `include` is provided, only fields
 * set to `true` (or provided as sub-include objects) are included.
 *
 * **Relation sub-includes:** `creatorProfile` and `digitalAsset` accept
 * sub-include objects for full control over which nested fields to fetch.
 */
export const CreatorIncludeSchema = z.object({
  /** Include array index position */
  arrayIndex: z.boolean().optional(),
  /** Include ERC165 interface ID */
  interfaceId: z.boolean().optional(),
  /** Include timestamp */
  timestamp: z.boolean().optional(),
  /** Include creator's Universal Profile — `true` for all fields, or object for per-field control */
  creatorProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include digital asset details — `true` for all fields, or object for per-field control */
  digitalAsset: z.union([z.boolean(), DigitalAssetIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 2 hooks
// ---------------------------------------------------------------------------

/** Params for useCreators — paginated list of creators */
export const UseCreatorsParamsSchema = z.object({
  filter: CreatorFilterSchema.optional(),
  sort: CreatorSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: CreatorIncludeSchema.optional(),
});

/** Params for useInfiniteCreators — infinite scroll variant */
export const UseInfiniteCreatorsParamsSchema = z.object({
  filter: CreatorFilterSchema.optional(),
  sort: CreatorSortSchema.optional(),
  pageSize: z.number().optional(),
  include: CreatorIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

/** Clean camelCase creator after parsing from Hasura. See {@link CreatorSchema}. */
export type Creator = z.infer<typeof CreatorSchema>;
/** Creator query filter parameters. See {@link CreatorFilterSchema}. */
export type CreatorFilter = z.infer<typeof CreatorFilterSchema>;
/** Available fields for sorting creators. See {@link CreatorSortFieldSchema}. */
export type CreatorSortField = z.infer<typeof CreatorSortFieldSchema>;
/** Creator sort configuration. See {@link CreatorSortSchema}. */
export type CreatorSort = z.infer<typeof CreatorSortSchema>;
/** Field inclusion config for creator queries. See {@link CreatorIncludeSchema}. */
export type CreatorInclude = z.infer<typeof CreatorIncludeSchema>;
/** Parameters for the `useCreators` hook. See {@link UseCreatorsParamsSchema}. */
export type UseCreatorsParams = z.infer<typeof UseCreatorsParamsSchema>;
/** Parameters for the `useInfiniteCreators` hook. See {@link UseInfiniteCreatorsParamsSchema}. */
export type UseInfiniteCreatorsParams = z.infer<typeof UseInfiniteCreatorsParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type (DX-04)
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → Creator field name.
 * Relations (creatorProfile, digitalAsset) handled by resolver types.
 */
type CreatorScalarIncludeFieldMap = {
  arrayIndex: 'arrayIndex';
  interfaceId: 'interfaceId';
  timestamp: 'timestamp';
};

/**
 * Resolve nested `creatorProfile` relation based on include parameter.
 * When include has `creatorProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveCreatorProfile<I> = I extends { creatorProfile: infer P }
  ? P extends true
    ? { creatorProfile: Profile | null }
    : P extends ProfileInclude
      ? { creatorProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `digitalAsset` relation based on include parameter.
 * When include has `digitalAsset` as a DigitalAssetInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveCreatorDigitalAsset<I> = I extends { digitalAsset: infer D }
  ? D extends true
    ? { digitalAsset: DigitalAsset | null }
    : D extends DigitalAssetInclude
      ? { digitalAsset: DigitalAssetResult<D> | null }
      : {}
  : {};

/**
 * Creator type narrowed by include parameter.
 *
 * - `CreatorResult` (no generic) → full `Creator` type (backward compatible)
 * - `CreatorResult<{}>` → `{ creatorAddress; digitalAssetAddress }` (base fields only)
 * - `CreatorResult<{ timestamp: true }>` → base + timestamp
 * - `CreatorResult<{ creatorProfile: { name: true } }>` → base + narrowed creator profile
 * - `CreatorResult<{ digitalAsset: { name: true, symbol: true } }>` → base + narrowed digital asset
 *
 * @example
 * ```ts
 * type Full = CreatorResult;                                           // = Creator (all fields)
 * type Minimal = CreatorResult<{}>;                                    // = { creatorAddress; digitalAssetAddress }
 * type WithTime = CreatorResult<{ timestamp: true }>;                  // = base + timestamp
 * type WithProf = CreatorResult<{ creatorProfile: { name: true } }>;   // = base + narrowed profile
 * type WithDA = CreatorResult<{ digitalAsset: { name: true } }>;       // = base + narrowed DA
 * ```
 */
export type CreatorResult<I extends CreatorInclude | undefined = undefined> = I extends undefined
  ? Creator
  : IncludeResult<
      Creator,
      'creatorAddress' | 'digitalAssetAddress',
      CreatorScalarIncludeFieldMap,
      I
    > &
      ResolveCreatorProfile<NonNullable<I>> &
      ResolveCreatorDigitalAsset<NonNullable<I>>;

/**
 * Creator with only base fields guaranteed — used for components that accept
 * any include-narrowed Creator.
 */
export type PartialCreator = PartialExcept<Creator, 'creatorAddress' | 'digitalAssetAddress'>;
