import { FetchNftsResult } from '@lsp-indexer/node';
import type { NftFilter, NftInclude, NftSort } from '@lsp-indexer/types';
import { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useNft — nft + query state */
export type UseNftReturn<F> = { nft: F | null } & Omit<UseQueryResult<F | null, Error>, 'data'>;

/** Flat return shape for useNfts — nfts array + totalCount + query state */
export type UseNftsReturn<F> = { nfts: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchNftsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteNfts — nfts array + infinite scroll controls + query state */
export type UseInfiniteNftsReturn<F> = {
  nfts: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchNftsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useNftSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: Nft[])`
 * - `include: I` → `onData(data: NftResult<I>[])`
 * - Widest   → `onData(data: PartialNft[])`
 */
export interface UseNftSubscriptionParams {
  /** Filter criteria (optional — omit for all NFTs) */
  filter?: NftFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: NftSort;
  /** Maximum NFTs in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: NftInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
