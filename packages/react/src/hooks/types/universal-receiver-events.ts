import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import type {
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useUniversalReceiverEvents — universalReceiverEvents array + totalCount + query state */
export type UseUniversalReceiverEventsReturn<F> = {
  universalReceiverEvents: F[];
  totalCount: number;
} & Omit<UseQueryResult<FetchUniversalReceiverEventsResult<F>, Error>, 'data'>;

/** Flat return shape for useInfiniteUniversalReceiverEvents — universalReceiverEvents array + infinite scroll controls + query state */
export type UseInfiniteUniversalReceiverEventsReturn<F> = {
  universalReceiverEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchUniversalReceiverEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Base params for `useUniversalReceiverEventSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: UniversalReceiverEvent[])`
 * - `include: I` → `onData(data: UniversalReceiverEventResult<I>[])`
 * - Widest   → `onData(data: PartialUniversalReceiverEvent[])`
 */
export interface UseUniversalReceiverEventSubscriptionParams {
  /** Filter criteria (optional — omit for all events) */
  filter?: UniversalReceiverEventFilter;
  /** Sort order (optional — defaults to block-order desc) */
  sort?: UniversalReceiverEventSort;
  /** Maximum events in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: UniversalReceiverEventInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
