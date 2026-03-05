import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import type {
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useLatestTokenIdDataChangedEvent — single event + query state */
export type UseLatestTokenIdDataChangedEventReturn<F> = {
  tokenIdDataChangedEvent: F | null;
} & Omit<UseQueryResult<F | null, Error>, 'data'>;

/** Flat return shape for useTokenIdDataChangedEvents — tokenIdDataChangedEvents array + totalCount + query state */
export type UseTokenIdDataChangedEventsReturn<F> = {
  tokenIdDataChangedEvents: F[];
  totalCount: number;
} & Omit<UseQueryResult<FetchTokenIdDataChangedEventsResult<F>, Error>, 'data'>;

/** Flat return shape for useInfiniteTokenIdDataChangedEvents — tokenIdDataChangedEvents array + infinite scroll controls + query state */
export type UseInfiniteTokenIdDataChangedEventsReturn<F> = {
  tokenIdDataChangedEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchTokenIdDataChangedEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useTokenIdDataChangedEventSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: TokenIdDataChangedEvent[])`
 * - `include: I` → `onData(data: TokenIdDataChangedEventResult<I>[])`
 * - Widest   → `onData(data: PartialTokenIdDataChangedEvent[])`
 */
export interface UseTokenIdDataChangedEventSubscriptionParams {
  /** Filter criteria (optional — omit for all events) */
  filter?: TokenIdDataChangedEventFilter;
  /** Sort order (optional — defaults to block-order desc) */
  sort?: TokenIdDataChangedEventSort;
  /** Maximum events in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: TokenIdDataChangedEventInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
