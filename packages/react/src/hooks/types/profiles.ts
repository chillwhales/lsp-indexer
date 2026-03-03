import { FetchProfilesResult } from '@lsp-indexer/node';
import { Profile, ProfileFilter } from '@lsp-indexer/types';
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
  /** Maximum profiles in subscription result (default: 10) */
  limit?: number;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when subscription receives new data */
  onData?: (data: Profile[]) => void;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
