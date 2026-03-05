import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import type { IssuedAssetFilter, IssuedAssetInclude, IssuedAssetSort } from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useIssuedAssets — issuedAssets array + totalCount + query state */
export type UseIssuedAssetsReturn<F> = { issuedAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchIssuedAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteIssuedAssets — issuedAssets array + infinite scroll controls + query state */
export type UseInfiniteIssuedAssetsReturn<F> = {
  issuedAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchIssuedAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useIssuedAssetSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: IssuedAsset[])`
 * - `include: I` → `onData(data: IssuedAssetResult<I>[])`
 * - Widest   → `onData(data: PartialIssuedAsset[])`
 */
export interface UseIssuedAssetSubscriptionParams {
  /** Filter criteria (optional — omit for all issued assets) */
  filter?: IssuedAssetFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: IssuedAssetSort;
  /** Maximum issued assets in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: IssuedAssetInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
