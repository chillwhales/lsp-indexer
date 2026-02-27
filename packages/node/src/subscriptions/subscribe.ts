import type {
  SubscriptionClient,
  SubscriptionConfig,
  SubscriptionHookOptions,
  SubscriptionResult,
} from '@lsp-indexer/types';
/**
 * Subscription utilities for `@lsp-indexer/node`.
 *
 * Since subscription state is now managed entirely within SubscriptionClient
 * implementations, this file mainly serves as documentation of the pattern.
 *
 * The flow is:
 * 1. Domain functions (like createProfilesSubscription) return SubscriptionConfig
 * 2. Hooks call client.createSubscription(config, options) 
 * 3. Client returns SubscriptionInstance with built-in state management
 * 4. Hooks sync their React/Next state with the instance using subscribe()
 *
 * This keeps the architecture clean:
 * - Node: Domain configuration building (pure functions)
 * - Client: Subscription state management (stateful class)
 * - Hooks: Framework integration (React useState + useEffect)
 */

// This file could export utility functions in the future, but for now
// the main pattern is that clients handle everything and node just
// provides domain configuration builders.
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setData(newData: T[] | null) {
    if (data !== newData) {
      data = newData;
      notifyListeners();
    }
  }

  function setError(newError: IndexerError | null) {
    if (error !== newError) {
      error = newError;
      notifyListeners();
    }
  }

  function setSubscribed(subscribed: boolean) {
    if (isSubscribed !== subscribed) {
      isSubscribed = subscribed;
      notifyListeners();
    }
  }

  function start() {
    if (!enabled || cleanup) return;

    // Register reconnect callback first
    reconnectCleanup = client.onReconnect(() => {
      onReconnect?.();
      // Note: We don't handle cache invalidation here since this is in node
      // The React/Next hooks will handle QueryClient invalidation
    });

    // Execute the subscription
    cleanup = client.executeSubscription(
      { query: document, variables },
      {
        next(result) {
          const rawData = result.data?.[dataKey];
          if (!rawData || !Array.isArray(rawData)) return;

          try {
            const parsed = parser(rawData);
            setData(parsed);
            setError(null);
            onData?.(parsed);
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
          setSubscribed(false);
        },
        complete() {
          setSubscribed(false);
        },
      },
    );

    setSubscribed(true);
  }

  function stop() {
    cleanup?.();
    cleanup = null;
    reconnectCleanup?.();
    reconnectCleanup = null;
    setSubscribed(false);
    setData(null);
    setError(null);
  }

  function dispose() {
    stop();
    listeners.clear();
  }

  // Start immediately if enabled
  if (enabled) {
    start();
  }

  // Return the result interface
  return {
    get data() {
      return data;
    },
    get isConnected() {
      return client.isConnected;
    },
    get isSubscribed() {
      return isSubscribed;
    },
    get error() {
      return error;
    },
    dispose,
    // Internal: allow hooks to subscribe to state changes
    subscribe,
  } as SubscriptionResult<T> & { subscribe: (listener: () => void) => () => void };
}
