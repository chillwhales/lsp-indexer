/**
 * Return type for subscription hooks across all packages.
 *
 * Shared between `@lsp-indexer/react` and `@lsp-indexer/next` so domain hooks
 * have a consistent consumer-facing API regardless of transport.
 */
export interface UseSubscriptionReturn<T> {
  /** Latest subscription data, or null if no data received yet */
  data: T[] | null;
  /** Whether the WebSocket connection is currently open */
  isConnected: boolean;
  /** Whether this specific subscription is currently active */
  isSubscribed: boolean;
  /**
   * Error from the subscription, if any.
   *
   * At runtime this will be an `IndexerError` instance (from `@lsp-indexer/node`)
   * for all errors surfaced by the subscription infrastructure. Typed as `unknown`
   * here because the `types` package must not depend on `node`.
   *
   * Consumers can narrow with:
   * ```ts
   * import { IndexerError } from '@lsp-indexer/node';
   * if (error instanceof IndexerError) { ... }
   * ```
   */
  error: unknown;
}

// ---------------------------------------------------------------------------
// Architecture Interfaces
// ---------------------------------------------------------------------------

/**
 * Hook-level subscription options — concerns that are specific to the
 * React/Next hook usage, not the domain logic. These are passed separately
 * to the generic `subscribe()` function.
 */
export interface SubscriptionHookOptions<T> {
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on data (default: false) */
  invalidate?: boolean;
  /** Query keys to invalidate when data arrives */
  invalidateKeys?: readonly (readonly unknown[])[];
  /** Callback when new data arrives */
  onData?: (data: T[]) => void;
  /** Callback on reconnect */
  onReconnect?: () => void;
}

/**
 * Subscription instance state managed by SubscriptionClient.
 * This represents a single active subscription within the client.
 */
export interface SubscriptionInstance<T> {
  /** Current subscription data, or null if no data received yet */
  readonly data: T[] | null;
  /** Current error state */
  readonly error: unknown;
  /** Whether this subscription is currently active */
  readonly isSubscribed: boolean;
  /** Subscribe to state changes for this subscription */
  subscribe(listener: () => void): () => void;
  /** Stop this subscription */
  dispose(): void;
}
