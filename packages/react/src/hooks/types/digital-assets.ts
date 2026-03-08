import { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import type { DigitalAssetFilter, DigitalAssetInclude, DigitalAssetSort } from '@lsp-indexer/types';
import { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useDigitalAsset — digitalAsset + query state */
export type UseDigitalAssetReturn<F> = { digitalAsset: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useDigitalAssets — digitalAssets array + totalCount + query state */
export type UseDigitalAssetsReturn<F> = { digitalAssets: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchDigitalAssetsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteDigitalAssets — digitalAssets array + infinite scroll controls + query state */
export type UseInfiniteDigitalAssetsReturn<F> = {
  digitalAssets: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchDigitalAssetsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useDigitalAssetSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: DigitalAsset[])`
 * - `include: I` → `onData(data: DigitalAssetResult<I>[])`
 * - Widest   → `onData(data: PartialDigitalAsset[])`
 */
export interface UseDigitalAssetSubscriptionParams {
  /** Filter criteria (optional — omit for all digital assets) */
  filter?: DigitalAssetFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: DigitalAssetSort;
  /** Maximum digital assets in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: DigitalAssetInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
