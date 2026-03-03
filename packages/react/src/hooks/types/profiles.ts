import { FetchProfilesResult } from '@lsp-indexer/node';
import type {
  PartialProfile,
  ProfileFilter,
  ProfileInclude,
  ProfileSort,
} from '@lsp-indexer/types';
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
  /**
   * Callback when subscription receives new data.
   *
   * Typed as `PartialProfile[]` at the params level because the implementation
   * signature uses the widest type. The overloaded call signatures narrow the
   * return type based on `include`; consumers without `include` get `Profile[]`.
   */
  onData?: (data: PartialProfile[]) => void;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
