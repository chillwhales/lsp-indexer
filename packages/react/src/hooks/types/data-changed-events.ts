import type {
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventSort,
} from '@lsp-indexer/types';

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
