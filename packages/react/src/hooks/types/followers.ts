import type { FetchFollowsResult } from '@lsp-indexer/node';
import type { FollowerFilter, FollowerInclude, FollowerSort } from '@lsp-indexer/types';
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
