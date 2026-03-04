import type { OwnedAssetFilter, OwnedAssetInclude, OwnedAssetSort } from '@lsp-indexer/types';

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
