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

/**
 * Common interface that both React and Next subscription clients must
 * implement. The client manages multiple subscriptions and their
 * individual state.
 *
 * The `createSubscription` method uses 4 generic parameters matching the
 * type-safe `SubscriptionConfig` from `@lsp-indexer/node`. The `document`
 * field is typed structurally as `{ toString(): string }` to avoid importing
 * `TypedDocumentString` into the types package.
 */
export interface SubscriptionClient {
  /**
   * Create and start a subscription using this client's transport.
   * Returns a subscription instance that manages the subscription's state.
   *
   * @param config - Domain subscription configuration (4-generic type-safe)
   * @param options - Hook-level options (callbacks, enabled state)
   * @returns Subscription instance with state management
   */
  createSubscription<TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
    config: {
      document: { toString(): string };
      variables: TVariables;
      extract: (result: TResult) => TRaw[];
      parser: (raw: TRaw[]) => TParsed[];
    },
    options?: SubscriptionHookOptions<TParsed>,
  ): SubscriptionInstance<TParsed>;

  /**
   * Register a callback to fire when the connection reconnects after a disconnect.
   * Used for cache invalidation and user notifications.
   *
   * @param callback - Function to call on reconnect
   * @returns Function to unregister the callback
   */
  onReconnect(callback: () => void): () => void;

  /** Whether the connection (WebSocket or SSE) is currently open */
  readonly isConnected: boolean;

  /** Dispose of all subscriptions and close the connection */
  dispose(): void;
}
