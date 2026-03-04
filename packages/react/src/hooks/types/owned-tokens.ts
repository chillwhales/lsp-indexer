import { FetchOwnedTokensResult } from '@lsp-indexer/node';
import type { OwnedTokenFilter, OwnedTokenInclude, OwnedTokenSort } from '@lsp-indexer/types';
import { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useOwnedToken — ownedToken + query state */
export type UseOwnedTokenReturn<F> = { ownedToken: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useOwnedTokens — ownedTokens array + totalCount + query state */
export type UseOwnedTokensReturn<F> = { ownedTokens: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchOwnedTokensResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteOwnedTokens */
export type UseInfiniteOwnedTokensReturn<F> = {
  ownedTokens: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchOwnedTokensResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useOwnedTokenSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: OwnedToken[])`
 * - `include: I` → `onData(data: OwnedTokenResult<I>[])`
 * - Widest   → `onData(data: PartialOwnedToken[])`
 */
export interface UseOwnedTokenSubscriptionParams {
  /** Filter criteria (optional — omit for all owned tokens) */
  filter?: OwnedTokenFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: OwnedTokenSort;
  /** Maximum owned tokens in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: OwnedTokenInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
