import { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import type { OwnedAssetFilter, OwnedAssetInclude, OwnedAssetSort } from '@lsp-indexer/types';
import { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useOwnedAsset — ownedAsset + query state */
export type UseOwnedAssetReturn<F> = { ownedAsset: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useOwnedAssets — ownedAssets array + totalCount + query state */
export type UseOwnedAssetsReturn<F> = { ownedAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchOwnedAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteOwnedAssets — ownedAssets array + infinite scroll controls + query state */
export type UseInfiniteOwnedAssetsReturn<F> = {
  ownedAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchOwnedAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useOwnedAssetSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: OwnedAsset[])`
 * - `include: I` → `onData(data: OwnedAssetResult<I>[])`
 * - Widest   → `onData(data: PartialOwnedAsset[])`
 */
export interface UseOwnedAssetSubscriptionParams {
  /** Filter criteria (optional — omit for all owned assets) */
  filter?: OwnedAssetFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: OwnedAssetSort;
  /** Maximum owned assets in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: OwnedAssetInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
