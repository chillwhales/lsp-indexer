import { z } from 'zod';

import { SortDirectionSchema } from './profiles';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** A single follower relationship from the `follower` table (current follow state) */
export const FollowerSchema = z.object({
  /** The address that IS following (the follower) */
  followerAddress: z.string(),
  /** The address being followed (the target) */
  followedAddress: z.string(),
});

/** Aggregated follow counts for a single address */
export const FollowCountSchema = z.object({
  /** Number of addresses following this address */
  followerCount: z.number(),
  /** Number of addresses this address is following */
  followingCount: z.number(),
});

// ---------------------------------------------------------------------------
// Sort schemas
// ---------------------------------------------------------------------------

/** Fields available for sorting follower lists */
export const FollowerSortFieldSchema = z.enum(['followerAddress', 'followedAddress']);

export const FollowerSortSchema = z.object({
  /** Which field to sort by */
  field: FollowerSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

export const UseFollowersParamsSchema = z.object({
  /** The address whose followers to fetch (who follows this address) */
  address: z.string(),
  /** Sort order for results */
  sort: FollowerSortSchema.optional(),
  /** Maximum number of followers to return */
  limit: z.number().optional(),
  /** Number of followers to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseFollowingParamsSchema = z.object({
  /** The address whose following list to fetch (who this address follows) */
  address: z.string(),
  /** Sort order for results */
  sort: FollowerSortSchema.optional(),
  /** Maximum number of following to return */
  limit: z.number().optional(),
  /** Number of following to skip (for offset-based pagination) */
  offset: z.number().optional(),
});

export const UseInfiniteFollowersParamsSchema = z.object({
  /** The address whose followers to fetch */
  address: z.string(),
  /** Sort order for results */
  sort: FollowerSortSchema.optional(),
  /** Number of followers per page (default: 20) */
  pageSize: z.number().optional(),
});

export const UseInfiniteFollowingParamsSchema = z.object({
  /** The address whose following list to fetch */
  address: z.string(),
  /** Sort order for results */
  sort: FollowerSortSchema.optional(),
  /** Number of following per page (default: 20) */
  pageSize: z.number().optional(),
});

export const UseFollowCountParamsSchema = z.object({
  /** The address to get follow counts for */
  address: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

export type Follower = z.infer<typeof FollowerSchema>;
export type FollowCount = z.infer<typeof FollowCountSchema>;
export type FollowerSort = z.infer<typeof FollowerSortSchema>;
export type FollowerSortField = z.infer<typeof FollowerSortFieldSchema>;
export type UseFollowersParams = z.infer<typeof UseFollowersParamsSchema>;
export type UseFollowingParams = z.infer<typeof UseFollowingParamsSchema>;
export type UseInfiniteFollowersParams = z.infer<typeof UseInfiniteFollowersParamsSchema>;
export type UseInfiniteFollowingParams = z.infer<typeof UseInfiniteFollowingParamsSchema>;
export type UseFollowCountParams = z.infer<typeof UseFollowCountParamsSchema>;
