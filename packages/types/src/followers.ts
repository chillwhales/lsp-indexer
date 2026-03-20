import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';
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

/** Active follow relationship — one per unique follower↔followed pair. */
export const FollowerSchema = z.object({
  /** Address that is doing the following */
  followerAddress: z.string(),
  /** Address that is being followed */
  followedAddress: z.string(),
  /** Timestamp when the follow relationship was created — ISO string (null when excluded via include) */
  timestamp: z.string().nullable(),
  /** Contract address of the follow relationship (null when excluded via include) */
  address: z.string().nullable(),
  /** Block number where follow event was emitted (null when excluded via include) */
  blockNumber: z.number().nullable(),
  /** Transaction index within the block (null when excluded via include) */
  transactionIndex: z.number().nullable(),
  /** Log index within the transaction (null when excluded via include) */
  logIndex: z.number().nullable(),
  /** Universal Profile of the follower (null = not included in query or no UP) */
  followerProfile: ProfileSchema.nullable(),
  /** Universal Profile of the followed (null = not included in query or no UP) */
  followedProfile: ProfileSchema.nullable(),
});

/** Follower + following counts for an address. */
export const FollowCountSchema = z.object({
  /** Number of profiles following this address */
  followerCount: z.number(),
  /** Number of profiles this address follows */
  followingCount: z.number(),
});

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

export const FollowerFilterSchema = z.object({
  /** Case-insensitive match on follower address */
  followerAddress: z.string().optional(),
  /** Case-insensitive match on followed address */
  followedAddress: z.string().optional(),
  /** Case-insensitive match on follower's profile name (nested via followerUniversalProfile.lsp3Profile.name) */
  followerName: z.string().optional(),
  /** Case-insensitive match on followed's profile name (nested via followedUniversalProfile.lsp3Profile.name) */
  followedName: z.string().optional(),
  /** Timestamp lower bound (inclusive) — ISO string or unix seconds. Maps to `timestamp: { _gte }` */
  timestampFrom: z.union([z.string(), z.number()]).optional(),
  /** Timestamp upper bound (inclusive) — ISO string or unix seconds. Maps to `timestamp: { _lte }` */
  timestampTo: z.union([z.string(), z.number()]).optional(),
});

// ---------------------------------------------------------------------------
// Sort schema
// ---------------------------------------------------------------------------

/** `newest`/`oldest` use deterministic block-order; `direction`/`nulls` ignored for those. */
export const FollowerSortFieldSchema = z.enum([
  'newest',
  'oldest',
  'followerAddress',
  'followedAddress',
  'followerName',
  'followedName',
]);

export const FollowerSortSchema = z.object({
  field: FollowerSortFieldSchema,
  direction: SortDirectionSchema,
  nulls: SortNullsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Include schema
// ---------------------------------------------------------------------------

/** Omit = fetch all fields; set individual fields to opt-in. */
export const FollowerIncludeSchema = z.object({
  /** Include timestamp when follow was created */
  timestamp: z.boolean().optional(),
  /** Include contract address */
  address: z.boolean().optional(),
  /** Include block number */
  blockNumber: z.boolean().optional(),
  /** Include transaction index */
  transactionIndex: z.boolean().optional(),
  /** Include log index */
  logIndex: z.boolean().optional(),
  /** Include follower's Universal Profile — `true` for all fields, or object for per-field control */
  followerProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
  /** Include followed's Universal Profile — `true` for all fields, or object for per-field control */
  followedProfile: z.union([z.boolean(), ProfileIncludeSchema]).optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas — 4 hooks
// ---------------------------------------------------------------------------

/**
 * Params for useFollows — query follow relationships.
 *
 * No mandatory address — use `filter.followerAddress` and/or
 * `filter.followedAddress` to scope results:
 * - "who follows X?" → `filter: { followedAddress: X }`
 * - "who does X follow?" → `filter: { followerAddress: X }`
 * - "all follows" → omit both (or add name/timestamp filters)
 */
export const UseFollowsParamsSchema = z.object({
  filter: FollowerFilterSchema.optional(),
  sort: FollowerSortSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include: FollowerIncludeSchema.optional(),
});

/** Params for useInfiniteFollows — infinite scroll variant of useFollows */
export const UseInfiniteFollowsParamsSchema = z.object({
  filter: FollowerFilterSchema.optional(),
  sort: FollowerSortSchema.optional(),
  pageSize: z.number().optional(),
  include: FollowerIncludeSchema.optional(),
});

/** Params for useFollowCount — follower + following counts for an address */
export const UseFollowCountParamsSchema = z.object({
  address: z.string(),
});

/** Params for useIsFollowing — check if one address follows another */
export const UseIsFollowingParamsSchema = z.object({
  /** The address that might be following */
  followerAddress: z.string(),
  /** The address that might be followed */
  followedAddress: z.string(),
});

/** Params for useIsFollowingBatch — check multiple follower→followed pairs at once */
export const UseIsFollowingBatchParamsSchema = z.object({
  /** Array of follower→followed pairs to check */
  pairs: z.array(
    z.object({
      /** The address that might be following */
      followerAddress: z.string(),
      /** The address that might be followed */
      followedAddress: z.string(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Follower = z.infer<typeof FollowerSchema>;
export type FollowCount = z.infer<typeof FollowCountSchema>;
export type FollowerFilter = z.infer<typeof FollowerFilterSchema>;
export type FollowerSortField = z.infer<typeof FollowerSortFieldSchema>;
export type FollowerSort = z.infer<typeof FollowerSortSchema>;
export type FollowerInclude = z.infer<typeof FollowerIncludeSchema>;
export type UseFollowsParams = z.infer<typeof UseFollowsParamsSchema>;
export type UseInfiniteFollowsParams = z.infer<typeof UseInfiniteFollowsParamsSchema>;
export type UseFollowCountParams = z.infer<typeof UseFollowCountParamsSchema>;
export type UseIsFollowingParams = z.infer<typeof UseIsFollowingParamsSchema>;
export type UseIsFollowingBatchParams = z.infer<typeof UseIsFollowingBatchParamsSchema>;

/** Result type for batch isFollowing — map of `"followerAddress:followedAddress"` → boolean */
export type IsFollowingBatchResult = Map<string, boolean>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Scalar include fields: include schema key → Follower field name.
 * Relations (followerProfile, followedProfile) handled by resolver types.
 */
type FollowerScalarIncludeFieldMap = {
  timestamp: 'timestamp';
  address: 'address';
  blockNumber: 'blockNumber';
  transactionIndex: 'transactionIndex';
  logIndex: 'logIndex';
};

/**
 * Resolve nested `followerProfile` relation based on include parameter.
 * When include has `followerProfile` as a ProfileInclude object, the field is
 * present and narrowed by sub-include. Otherwise absent from type.
 */
type ResolveFollowerProfile<I> = I extends { followerProfile: infer P }
  ? P extends true
    ? { followerProfile: Profile | null }
    : P extends ProfileInclude
      ? { followerProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Resolve nested `followedProfile` relation based on include parameter.
 * Same pattern as ResolveFollowerProfile but for the followed side.
 */
type ResolveFollowedProfile<I> = I extends { followedProfile: infer P }
  ? P extends true
    ? { followedProfile: Profile | null }
    : P extends ProfileInclude
      ? { followedProfile: ProfileResult<P> | null }
      : {}
  : {};

/**
 * Follower type narrowed by include parameter.
 *
 * - `FollowerResult` (no generic) → full `Follower` type (backward compatible)
 * - `FollowerResult<{}>` → `{ followerAddress; followedAddress }` (base fields only)
 * - `FollowerResult<{ timestamp: true }>` → base + timestamp
 * - `FollowerResult<{ followerProfile: { name: true } }>` → base + narrowed follower profile
 *
 * @example
 * ```ts
 * type Full = FollowerResult;                                        // = Follower (all fields)
 * type Minimal = FollowerResult<{}>;                                 // = { followerAddress; followedAddress }
 * type WithTime = FollowerResult<{ timestamp: true }>;               // = base + timestamp
 * type WithProf = FollowerResult<{ followerProfile: { name: true } }>; // = base + narrowed profile
 * ```
 */
export type FollowerResult<I extends FollowerInclude | undefined = undefined> = I extends undefined
  ? Follower
  : IncludeResult<
      Follower,
      'followerAddress' | 'followedAddress',
      FollowerScalarIncludeFieldMap,
      I
    > &
      ResolveFollowerProfile<NonNullable<I>> &
      ResolveFollowedProfile<NonNullable<I>>;

/**
 * Follower with only base fields guaranteed — used for components that accept
 * any include-narrowed Follower.
 */
export type PartialFollower = PartialExcept<Follower, 'followerAddress' | 'followedAddress'>;
