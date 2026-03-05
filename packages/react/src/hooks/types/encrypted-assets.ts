import type {
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetSort,
} from '@lsp-indexer/types';

/**
 * Base params for `useEncryptedAssetSubscription`.
 *
 * `onData` is intentionally omitted here — it is added per-overload in the
 * factory so the callback receives the correctly-narrowed type:
 * - No `include` → `onData(data: EncryptedAsset[])`
 * - `include: I` → `onData(data: EncryptedAssetResult<I>[])`
 * - Widest   → `onData(data: PartialEncryptedAsset[])`
 */
export interface UseEncryptedAssetSubscriptionParams {
  /** Filter criteria (optional — omit for all encrypted assets) */
  filter?: EncryptedAssetFilter;
  /** Sort order (optional — omit for Hasura default ordering) */
  sort?: EncryptedAssetSort;
  /** Maximum encrypted assets in subscription result (default: 10) */
  limit?: number;
  /** Field inclusion config (optional — omit for all fields) */
  include?: EncryptedAssetInclude;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}
