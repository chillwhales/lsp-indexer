import type { FetchFollowsResult, FetchProfilesResult } from '@lsp-indexer/node';
import type {
  FollowCount,
  FollowerFilter,
  FollowerInclude,
  FollowerSort,
} from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useFollows — follows array + totalCount + query state */
export type UseFollowsReturn<F> = { follows: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchFollowsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteFollows — follows array + infinite scroll controls + query state */
export type UseInfiniteFollowsReturn<F> = {
  follows: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchFollowsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/** Flat return shape for useFollowCount — follower + following counts + query state */
export type UseFollowCountReturn = {
  followerCount: number;
  followingCount: number;
} & Omit<UseQueryResult<FollowCount, Error>, 'data'>;

/** Flat return shape for useIsFollowing — boolean result + query state */
export type UseIsFollowingReturn = {
  isFollowing: boolean;
} & Omit<UseQueryResult<boolean, Error>, 'data'>;

/** Flat return shape for useIsFollowingBatch — Map of pair keys to boolean + query state */
export type UseIsFollowingBatchReturn = {
  results: Map<string, boolean>;
} & Omit<UseQueryResult<Map<string, boolean>, Error>, 'data'>;

/**
 * Base params for `useFollowerSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: Follower[])`
 * - `include: I` → `onData(data: FollowerResult<I>[])`
 * - Widest   → `onData(data: PartialFollower[])`
 */
export interface UseFollowerSubscriptionParams {
  /** Filter criteria (optional — omit for all followers) */
  filter?: FollowerFilter;
  /** Sort order (optional — defaults to block-order desc) */
  sort?: FollowerSort;
  /** Maximum followers in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: FollowerInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}

// ---------------------------------------------------------------------------
// Mutual follow return types (all return profiles, not followers)
// ---------------------------------------------------------------------------

/** Flat return shape for useMutualFollows — profiles array + totalCount + query state */
export type UseMutualFollowsReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteMutualFollows — profiles array + infinite scroll controls + query state */
export type UseInfiniteMutualFollowsReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/** Flat return shape for useMutualFollowers — profiles array + totalCount + query state */
export type UseMutualFollowersReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteMutualFollowers — profiles array + infinite scroll controls + query state */
export type UseInfiniteMutualFollowersReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/** Flat return shape for useFollowedByMyFollows — profiles array + totalCount + query state */
export type UseFollowedByMyFollowsReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteFollowedByMyFollows — profiles array + infinite scroll controls + query state */
export type UseInfiniteFollowedByMyFollowsReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;
