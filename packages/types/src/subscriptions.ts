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
