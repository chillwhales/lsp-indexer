import { FetchProfilesResult } from '@lsp-indexer/node';
import type { ProfileFilter, ProfileInclude, ProfileSort } from '@lsp-indexer/types';
import { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useProfile — profile + query state */
export type UseProfileReturn<F> = { profile: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useProfiles — profiles array + totalCount + query state */
export type UseProfilesReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteProfiles — profiles array + infinite scroll controls + query state */
export type UseInfiniteProfilesReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useProfileSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: Profile[])`
 * - `include: I` → `onData(data: ProfileResult<I>[])`
 * - Widest   → `onData(data: PartialProfile[])`
 */
export interface UseProfileSubscriptionParams {
  /** Filter criteria (optional — omit for all profiles) */
  filter?: ProfileFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: ProfileSort;
  /** Maximum profiles in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: ProfileInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
