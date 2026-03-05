import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import type {
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventSort,
} from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useLatestDataChangedEvent — single event + query state */
export type UseLatestDataChangedEventReturn<F> = { dataChangedEvent: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

/** Flat return shape for useDataChangedEvents — dataChangedEvents array + totalCount + query state */
export type UseDataChangedEventsReturn<F> = { dataChangedEvents: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchDataChangedEventsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteDataChangedEvents — dataChangedEvents array + infinite scroll controls + query state */
export type UseInfiniteDataChangedEventsReturn<F> = {
  dataChangedEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchDataChangedEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useDataChangedEventSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: DataChangedEvent[])`
 * - `include: I` → `onData(data: DataChangedEventResult<I>[])`
 * - Widest   → `onData(data: PartialDataChangedEvent[])`
 */
export interface UseDataChangedEventSubscriptionParams {
  /** Filter criteria (optional — omit for all events) */
  filter?: DataChangedEventFilter;
  /** Sort order (optional — defaults to block-order desc) */
  sort?: DataChangedEventSort;
  /** Maximum events in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: DataChangedEventInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
