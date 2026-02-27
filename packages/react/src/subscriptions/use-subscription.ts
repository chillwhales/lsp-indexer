import { IndexerError } from '@lsp-indexer/node';
import type {
  BaseSubscriptionOptions,
  UseSubscriptionReturn as BaseSubscriptionReturn,
} from '@lsp-indexer/types';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSubscriptionClient } from './context';

/**
 * Options for the generic useSubscription hook.
 *
 * This is the core engine that all domain subscription hooks wrap.
 * Domain hooks provide the document, dataKey, parser, and variables —
 * useSubscription handles the WebSocket lifecycle.
 */
export interface UseSubscriptionOptions<TParsed> extends BaseSubscriptionOptions<TParsed> {
  /**
   * TanStack QueryClient for cache invalidation.
   * Passed by domain hooks (they call useQueryClient in try/catch and pass through).
   * The generic hook does NOT call useQueryClient itself — avoiding conditional hook issues.
   */
  queryClient?: QueryClient;
}

/** Return type for useSubscription */
export interface UseSubscriptionReturn<T> extends Omit<BaseSubscriptionReturn<T>, 'error'> {
  /** Error from the subscription, if any */
  error: IndexerError | null;
}

/**
 * Generic subscription hook — the core engine for all domain subscription hooks.
 *
 * Manages the full subscription lifecycle:
 * 1. Connection state via useSyncExternalStore (reading from SubscriptionClient)
 * 2. Subscription creation/destruction via useEffect
 * 3. Data state, error state, subscribed state
 * 4. Cache invalidation via optional QueryClient
 * 5. Callbacks for onData and onReconnect
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
  } = options;

  const client = useSubscriptionClient();

  // Connection state via useSyncExternalStore
  const connectionState = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getServerSnapshot,
  );
  const isConnected = connectionState === 'connected';

  // Data, subscribed, and error state
  const [data, setData] = useState<TParsed[] | null>(null);
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
      setIsSubscribed(false);
    }
  }, [enabled]);

  // Subscription lifecycle
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const cleanup = client.executeSubscription(
      { query: document, variables: JSON.parse(stableVariables) },
      {
        next(result) {
          if (cancelled) return;

          const rawData = result.data?.[dataKey];
          if (!rawData || !Array.isArray(rawData)) return;

          try {
            const parsed = parserRef.current(rawData);
            setData(parsed);
            setError(null);

            // Fire onData callback
            onDataRef.current?.(parsed);

            // Cache invalidation
            invalidateCaches(
              invalidateRef.current,
              queryClientRef.current,
              invalidateKeysRef.current,
            );
          } catch (parseError) {
            setError(
              new IndexerError({
                category: 'PARSE',
                code: 'PARSE_FAILED',
                message: `Failed to parse subscription data for "${dataKey}": ${
                  parseError instanceof Error ? parseError.message : String(parseError)
                }`,
                originalError: parseError instanceof Error ? parseError : undefined,
              }),
            );
          }
        },
        error(rawError: unknown) {
          if (cancelled) return;

          if (rawError instanceof IndexerError) {
            setError(rawError);
          } else if (Array.isArray(rawError)) {
            // GraphQL errors array
            setError(
              IndexerError.fromGraphQLErrors(
                rawError.map(IndexerError.narrowGraphQLError),
                document,
              ),
            );
          } else {
            setError(
              new IndexerError({
                category: 'NETWORK',
                code: 'NETWORK_UNKNOWN',
                message: `Subscription error for "${dataKey}": ${
                  rawError instanceof Error ? rawError.message : String(rawError)
                }`,
                originalError: rawError instanceof Error ? rawError : undefined,
              }),
            );
          }
          setIsSubscribed(false);
        },
        complete() {
          if (cancelled) return;
          setIsSubscribed(false);
        },
      },
    );

    setIsSubscribed(true);

    return () => {
      cancelled = true;
      cleanup();
      setIsSubscribed(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, document, stableVariables, dataKey, enabled]);

  // Reconnect callback registration
  useEffect(() => {
    const unregister = client.onReconnect(() => {
      // Fire user's onReconnect callback
      onReconnectRef.current?.();

      // Invalidate caches on reconnect (stale after disconnect)
      invalidateCaches(invalidateRef.current, queryClientRef.current, invalidateKeysRef.current);
    });

    return unregister;
  }, [client]);

  return { data, isConnected, isSubscribed, error };
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
