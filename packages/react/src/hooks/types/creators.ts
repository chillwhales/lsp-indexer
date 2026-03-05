import type { FetchCreatorsResult } from '@lsp-indexer/node';
import type { CreatorFilter, CreatorInclude, CreatorSort } from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useCreators — creators array + totalCount + query state */
export type UseCreatorsReturn<F> = { creators: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchCreatorsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteCreators — creators array + infinite scroll controls + query state */
export type UseInfiniteCreatorsReturn<F> = {
  creators: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchCreatorsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useCreatorSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: Creator[])`
 * - `include: I` → `onData(data: CreatorResult<I>[])`
 * - Widest   → `onData(data: PartialCreator[])`
 */
export interface UseCreatorSubscriptionParams {
  /** Filter criteria (optional — omit for all creators) */
  filter?: CreatorFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: CreatorSort;
  /** Maximum creators in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: CreatorInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
