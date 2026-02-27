import type {
  SubscriptionConfig,
  SubscriptionHookOptions,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSubscriptionClient } from './context';

/**
 * Thin wrapper around SubscriptionClient for React applications.
 *
 * This hook:
 * 1. Creates a subscription instance using the client from context
 * 2. Syncs React state with the subscription instance state
 * 3. Handles framework-specific concerns like QueryClient invalidation
 * 4. Provides the same API as the Next.js package for consistency
 *
 * The heavy lifting (connection management, parsing, error handling) is done
 * by the SubscriptionClient and subscription instances.
 */
export function useSubscription<T>(
  config: SubscriptionConfig<T>,
  options: SubscriptionHookOptions<T> & {
    /** TanStack QueryClient for cache invalidation */
    queryClient?: QueryClient;
    /** Query keys to invalidate when data arrives */
    invalidateKeys?: readonly (readonly unknown[])[];
    /** Whether to invalidate caches on data arrival */
    invalidate?: boolean;
  } = {},
): UseSubscriptionReturn<T> {
  const client = useSubscriptionClient();
  const subscriptionRef = useRef<ReturnType<typeof client.createSubscription> | null>(null);

  // React state that syncs with subscription instance
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Connection state from client (useSyncExternalStore for external state)
  const isConnected =
    useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot) ===
    'connected';

  // Stable refs for callbacks to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create/dispose subscription based on enabled state
  useEffect(() => {
    const {
      enabled = true,
      onData,
      onReconnect,
      queryClient,
      invalidateKeys,
      invalidate,
    } = optionsRef.current;

    if (!enabled) {
      // Dispose existing subscription if disabled
      if (subscriptionRef.current) {
        subscriptionRef.current.dispose();
        subscriptionRef.current = null;
        setData(null);
        setError(null);
        setIsSubscribed(false);
      }
      return;
    }

    // Create new subscription
    const subscription = client.createSubscription(config, {
      enabled,
      onData: (newData: T[]) => {
        // Cache invalidation
        if (invalidate && queryClient && invalidateKeys) {
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: [...key] });
          }
        }

        // User callback
        onData?.(newData);
      },
      onReconnect: () => {
        // Cache invalidation on reconnect (data may be stale after disconnect)
        if (invalidate && queryClient && invalidateKeys) {
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: [...key] });
          }
        }

        // User callback
        onReconnect?.();
      },
    });

    subscriptionRef.current = subscription;

    // Sync React state with subscription instance state
    const unsubscribe = subscription.subscribe(() => {
      setData(subscription.data);
      setError(subscription.error);
      setIsSubscribed(subscription.isSubscribed);
    });

    // Set initial state
    setData(subscription.data);
    setError(subscription.error);
    setIsSubscribed(subscription.isSubscribed);

    return () => {
      unsubscribe();
      subscription.dispose();
      subscriptionRef.current = null;
    };
  }, [
    config.document,
    config.dataKey,
    JSON.stringify(config.variables), // Stable variables comparison
    options.enabled,
    client,
  ]);

  return {
    data,
    isConnected,
    isSubscribed,
    error,
  };
}
