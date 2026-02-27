/**
 * Base options for subscription hooks across all packages.
 *
 * Both `@lsp-indexer/react` (WebSocket) and `@lsp-indexer/next` (SSE) extend
 * or use this interface directly. Transport-specific options (e.g., `url` for SSE)
 * are added by each package.
 */
export interface BaseSubscriptionOptions<TParsed> {
  /** GraphQL subscription document string */
  document: string;
  /** The key in the GraphQL response object (e.g., 'universal_profile') */
  dataKey: string;
  /** GraphQL variables (where, order_by, limit) */
  variables: Record<string, unknown>;
  /**
   * Parser function to transform raw Hasura data to clean types.
   * Receives `unknown[]` because the GraphQL response is untyped at runtime;
   * the parser is responsible for validating/coercing each element.
   */
  parser: (raw: unknown[]) => TParsed[];
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on data (default: false) */
  invalidate?: boolean;
  /** Query keys to invalidate when data arrives */
  invalidateKeys?: readonly (readonly unknown[])[];
  /** Callback when new data arrives */
  onData?: (data: TParsed[]) => void;
  /** Callback on reconnect (WebSocket reconnect or SSE reconnect) */
  onReconnect?: () => void;
}

/**
 * Return type for subscription hooks across all packages.
 *
 * Shared between `@lsp-indexer/react` and `@lsp-indexer/next` so domain hooks
 * have a consistent consumer-facing API regardless of transport.
 */
export interface UseSubscriptionReturn<T> {
  /** Latest subscription data, or null if no data received yet */
  data: T[] | null;
  /** Whether the connection (WebSocket or SSE) is currently open */
  isConnected: boolean;
  /** Whether this specific subscription is currently active */
  isSubscribed: boolean;
  /** Error from the subscription, if any */
  error: unknown;
}

// ---------------------------------------------------------------------------
// New Architecture Interfaces (Refactor)
// ---------------------------------------------------------------------------

/**
 * Configuration for a domain subscription - what domain functions like
 * `createProfilesSubscription()` return. Contains all the domain-specific
 * logic (document, variables, parsing) but no transport concerns.
 */
export interface SubscriptionConfig<T> {
  /** GraphQL subscription document string */
  document: string;
  /** The key in the GraphQL response object (e.g., 'universal_profile') */
  dataKey: string;
  /** GraphQL variables (where, order_by, limit) */
  variables: Record<string, unknown>;
  /**
   * Parser function to transform raw Hasura data to clean types.
   * Receives `unknown[]` because GraphQL responses are untyped at runtime;
   * the parser validates/coerces each element to the domain type.
   */
  parser: (raw: unknown[]) => T[];
}

/**
 * Hook-level subscription options - concerns that are specific to the
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
  /** Callback on reconnect (WebSocket reconnect or SSE reconnect) */
  onReconnect?: () => void;
}

/**
 * Return type for the generic `subscribe()` function in `@lsp-indexer/node`.
 * Contains all the state needed by hooks but in a framework-agnostic way.
 */
export interface SubscriptionResult<T> {
  /** Latest subscription data, or null if no data received yet */
  data: T[] | null;
  /** Whether the connection (WebSocket or SSE) is currently open */
  isConnected: boolean;
  /** Whether this specific subscription is currently active */
  isSubscribed: boolean;
  /** Error from the subscription, if any (IndexerError type) */
  error: unknown;
  /** Function to dispose of the subscription and clean up resources */
  dispose: () => void;
}

/**
 * Sink interface for subscription events.
 * Both React (WebSocket) and Next (SSE) clients implement this callback pattern.
 */
export interface SubscriptionSink {
  /** Called when new subscription data arrives */
  next: (result: { data?: Record<string, unknown> }) => void;
  /** Called when the subscription encounters an error */
  error: (error: unknown) => void;
  /** Called when the subscription completes normally */
  complete: () => void;
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
 * Common interface that both React (WebSocket) and Next (SSE) subscription
 * clients must implement. The client manages multiple subscriptions and
 * their individual state.
 */
export interface SubscriptionClient {
  /**
   * Create and start a subscription using this client's transport.
   * Returns a subscription instance that manages the subscription's state.
   *
   * @param config - Domain subscription configuration
   * @param options - Hook-level options (callbacks, enabled state)
   * @returns Subscription instance with state management
   */
  createSubscription<T>(
    config: SubscriptionConfig<T>,
    options?: SubscriptionHookOptions<T>,
  ): SubscriptionInstance<T>;

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
