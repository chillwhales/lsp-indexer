import { IndexerError } from '@lsp-indexer/node';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

/**
 * Safely extract `{ message, extensions }` from an unknown GraphQL error object.
 * graphql-ws types subscription errors as `unknown` to avoid DOM deps,
 * so we narrow with runtime checks instead of type assertions.
 */
function toGraphQLError(e: unknown): {
  message: string;
  extensions: Record<string, unknown> | undefined;
} {
  if (typeof e !== 'object' || e === null) {
    return { message: String(e), extensions: undefined };
  }
  const message = 'message' in e && typeof e.message === 'string' ? e.message : String(e);
  let extensions: Record<string, unknown> | undefined;
  if (
    'extensions' in e &&
    typeof e.extensions === 'object' &&
    e.extensions !== null &&
    !Array.isArray(e.extensions)
  ) {
    // e.extensions is narrowed to `object` here; spread into a fresh record
    // to satisfy the Record<string, unknown> constraint without assertions.
    extensions = Object.fromEntries(Object.entries(e.extensions));
  }
  return { message, extensions };
}

/**
 * Options for the SSE-based `useSubscription` hook.
 *
 * This is the core engine that all domain subscription hooks in `@lsp-indexer/next` wrap.
 * Domain hooks provide the document, dataKey, parser, and variables —
 * `useSubscription` handles the SSE lifecycle.
 *
 * The API shape mirrors `@lsp-indexer/react`'s `UseSubscriptionOptions`, but the
 * transport is SSE instead of a direct WebSocket. The Next.js server proxies the
 * WebSocket connection to Hasura, keeping the GraphQL endpoint hidden from the client.
 */
export interface UseSubscriptionOptions<TParsed> {
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
  /** Callback on SSE reconnect (EventSource auto-reconnects on disconnect) */
  onReconnect?: () => void;
  /**
   * TanStack QueryClient for cache invalidation.
   * Passed by domain hooks (they call useQueryClient in try/catch and pass through).
   * The generic hook does NOT call useQueryClient itself — avoiding conditional hook issues.
   */
  queryClient?: QueryClient;
  /**
   * SSE endpoint URL served by `createSubscriptionHandler`.
   * @default '/api/subscriptions'
   */
  url?: string;
}

/**
 * Return type for the SSE-based `useSubscription` hook.
 *
 * Mirrors `@lsp-indexer/react`'s `UseSubscriptionReturn` so domain hooks
 * can share the same consumer-facing API regardless of transport.
 */
export interface UseSubscriptionReturn<T> {
  /** Latest subscription data, or null if no data received yet */
  data: T[] | null;
  /** Whether the SSE connection is currently open */
  isConnected: boolean;
  /** Whether this specific subscription is currently active */
  isSubscribed: boolean;
  /** Error from the subscription, if any */
  error: IndexerError | null;
}

/** Default SSE endpoint path for the subscription route handler. */
const DEFAULT_SSE_URL = '/api/subscriptions';

/**
 * SSE-based subscription hook for `@lsp-indexer/next`.
 *
 * Manages the full subscription lifecycle via Server-Sent Events:
 * 1. Constructs the SSE URL with query + variables as search params
 * 2. Connects via `EventSource` (browser-native SSE client)
 * 3. Parses incoming data through the domain parser
 * 4. Tracks connection state, subscription state, and errors
 * 5. Handles auto-reconnection (EventSource reconnects automatically)
 * 6. Fires `onData` and `onReconnect` callbacks
 * 7. Invalidates TanStack Query caches when configured
 *
 * **Transport difference from `@lsp-indexer/react`:** The react package connects
 * directly to Hasura via WebSocket (graphql-ws). This hook connects to a Next.js
 * SSE endpoint that proxies the WebSocket server-side, keeping the Hasura URL hidden.
 *
 * @example
 * ```ts
 * // Domain hooks wrap this with their specific document, dataKey, and parser:
 * const result = useSubscription({
 *   document: ProfileSubscriptionDocument,
 *   dataKey: 'universal_profile',
 *   variables: { where: { address: { _ilike: '0x...' } }, limit: 10 },
 *   parser: parseProfiles,
 * });
 * ```
 */
export function useSubscription<TParsed>(
  options: UseSubscriptionOptions<TParsed>,
): UseSubscriptionReturn<TParsed> {
  const {
    document,
    dataKey,
    variables,
    parser,
    enabled = true,
    invalidate = false,
    invalidateKeys,
    queryClient,
    url = DEFAULT_SSE_URL,
  } = options;

  // Data, subscribed, connected, and error state
  const [data, setData] = useState<TParsed[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<IndexerError | null>(null);

  // Stable refs for callbacks (avoid stale closures and unnecessary effect re-runs)
  const onDataRef = useRef(options.onData);
  onDataRef.current = options.onData;

  const onReconnectRef = useRef(options.onReconnect);
  onReconnectRef.current = options.onReconnect;

  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const invalidateKeysRef = useRef(invalidateKeys);
  invalidateKeysRef.current = invalidateKeys;

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const parserRef = useRef(parser);
  parserRef.current = parser;

  // Stable variables string to avoid object reference churn in effect deps
  const stableVariables = JSON.stringify(variables);

  // Reset state when disabled
  useEffect(() => {
    if (!enabled) {
      setData(null);
      setError(null);
      setIsConnected(false);
      setIsSubscribed(false);
    }
  }, [enabled]);

  // SSE subscription lifecycle
  useEffect(() => {
    if (!enabled) return;

    // Build the SSE URL with query and variables as search params
    const sseUrl = buildSSEUrl(url, document, stableVariables);

    const eventSource = new EventSource(sseUrl);

    // Track whether we've been connected before (for reconnect detection)
    let wasConnectedBefore = false;

    eventSource.onopen = () => {
      const isReconnect = wasConnectedBefore;
      wasConnectedBefore = true;

      setIsConnected(true);
      setIsSubscribed(true);
      setError(null);

      if (isReconnect) {
        // Fire user's onReconnect callback
        onReconnectRef.current?.();

        // Invalidate caches on reconnect (stale after disconnect)
        invalidateCaches(invalidateRef.current, queryClientRef.current, invalidateKeysRef.current);
      }
    };

    // Default "message" event — subscription data frames
    eventSource.onmessage = (event: MessageEvent<string>) => {
      try {
        const result: unknown = JSON.parse(event.data);

        // Extract the data array from the GraphQL response using
        // type narrowing (no type assertions).
        const rawArray = extractDataArray(result, dataKey);
        if (!rawArray) return;

        const parsed = parserRef.current(rawArray);
        setData(parsed);
        setError(null);

        // Fire onData callback
        onDataRef.current?.(parsed);

        // Cache invalidation
        invalidateCaches(invalidateRef.current, queryClientRef.current, invalidateKeysRef.current);
      } catch (parseError) {
        setError(
          new IndexerError({
            category: 'PARSE',
            code: 'EMPTY_RESPONSE',
            message: `Failed to parse subscription data for "${dataKey}": ${
              parseError instanceof Error ? parseError.message : String(parseError)
            }`,
            originalError: parseError instanceof Error ? parseError : undefined,
          }),
        );
      }
    };

    // Named "error" event — GraphQL or server errors sent by the handler.
    // EventSource fires both generic connection errors (Event) and custom
    // named "error" events (MessageEvent with data). We distinguish by
    // checking for the `data` property — only MessageEvents carry it.
    eventSource.addEventListener('error', (event: Event) => {
      if (!('data' in event) || typeof event.data !== 'string') return;

      try {
        const payload: unknown = JSON.parse(event.data);
        if (typeof payload !== 'object' || payload === null) return;

        if (Array.isArray(payload)) {
          // GraphQL errors array
          setError(IndexerError.fromGraphQLErrors(payload.map(toGraphQLError), document));
        } else if ('message' in payload && typeof payload.message === 'string') {
          setError(
            new IndexerError({
              category: 'NETWORK',
              code: 'NETWORK_UNKNOWN',
              message: `Subscription error for "${dataKey}": ${payload.message}`,
            }),
          );
        }
      } catch {
        // Couldn't parse the error payload — fall through to generic handling
        setError(
          new IndexerError({
            category: 'NETWORK',
            code: 'NETWORK_UNKNOWN',
            message: `Subscription error for "${dataKey}": unparseable error event`,
          }),
        );
      }
      setIsSubscribed(false);
    });

    // "complete" event — subscription ended normally
    eventSource.addEventListener('complete', () => {
      setIsSubscribed(false);
    });

    // Connection-level error (network drop, server unreachable)
    // Note: EventSource auto-reconnects — this fires on each disconnect.
    // The onerror handler runs BEFORE onopen on reconnect.
    eventSource.onerror = () => {
      setIsConnected(false);
      // Don't set isSubscribed to false here — EventSource will auto-reconnect
      // and onopen will fire again. If it truly fails, the browser closes the
      // EventSource and readyState becomes CLOSED.
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsSubscribed(false);
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
      setIsSubscribed(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, stableVariables, dataKey, enabled, url]);

  return { data, isConnected, isSubscribed, error };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a non-null object (type guard).
 * After this guard, properties can be accessed via `'key' in obj` narrowing.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract the data array for a given key from an unknown parsed GraphQL result.
 * Uses runtime type guards only — no type assertions.
 *
 * Expected shape: `{ data: { [dataKey]: unknown[] } }`
 */
function extractDataArray(result: unknown, dataKey: string): unknown[] | null {
  if (!isRecord(result)) return null;
  const responseData: unknown = result['data'];
  if (!isRecord(responseData)) return null;
  const rawArray: unknown = responseData[dataKey];
  if (!Array.isArray(rawArray)) return null;
  return rawArray;
}

/**
 * Build the full SSE URL with query and variables as search params.
 * Variables are passed as the pre-stringified JSON to avoid double-serializing.
 */
function buildSSEUrl(baseUrl: string, query: string, variablesJson: string): string {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('variables', variablesJson);
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Invalidate TanStack Query caches if configured.
 * Shared between data arrival and reconnect paths.
 */
function invalidateCaches(
  shouldInvalidate: boolean,
  client: QueryClient | undefined,
  keys: readonly (readonly unknown[])[] | undefined,
): void {
  if (!shouldInvalidate || !client || !keys) return;
  for (const key of keys) {
    client.invalidateQueries({ queryKey: [...key] });
  }
}
