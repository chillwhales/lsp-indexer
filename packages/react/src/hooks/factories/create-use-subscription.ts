/**
 * Generic factory for subscription hooks.
 *
 * Domain subscription factories accept the already-instantiated `useSubscription` hook
 * rather than wrapping this factory directly, because `useSubscription` is context-bound
 * (React uses direct WebSocket context, Next.js uses a proxy context).
 */
import type { SubscriptionConfig } from '@lsp-indexer/node';
import type { SubscriptionInstance, UseSubscriptionReturn } from '@lsp-indexer/types';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { stableStringify } from '../../utils';
import { UseSubscriptionClient, UseSubscriptionOptions } from '../types';

/** Create a real-time subscription hook from the given config. */
export function createUseSubscription(useSubscriptionClient: () => UseSubscriptionClient) {
  return function useSubscription<
    TResult,
    TVariables extends Record<string, unknown>,
    TRaw,
    TParsed,
  >(
    config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
    options: UseSubscriptionOptions<TParsed> = {},
  ): UseSubscriptionReturn<TParsed> {
    const client = useSubscriptionClient();
    const subscriptionRef = useRef<SubscriptionInstance<TParsed> | null>(null);

    // React state that syncs with subscription instance
    const [data, setData] = useState<TParsed[] | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Connection state from client (useSyncExternalStore for external state)
    const isConnected =
      useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot) ===
      'connected';

    // Stable refs for callbacks and config to avoid stale closures.
    // The ref assignment during render is a well-known pattern that keeps
    // callbacks fresh without adding them to the effect dependency array.
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const configRef = useRef(config);
    configRef.current = config;

    // Stable serialised variables for the dependency array.
    // Extracted as a local variable (not inline in deps) to satisfy the
    // react-hooks/exhaustive-deps lint rule.
    //
    // Uses stableStringify (sorted keys) instead of plain JSON.stringify
    // to guarantee deterministic output regardless of property insertion
    // order. GraphQL variables should be plain JSON — non-JSON values
    // (Date, BigInt, undefined) are not supported.
    const stableVariables = stableStringify(config.variables);

    // Create/dispose subscription based on enabled state
    useEffect(() => {
      const { enabled = true } = optionsRef.current;

      if (!enabled) {
        // Dispose existing subscription if disabled
        if (subscriptionRef.current) {
          subscriptionRef.current.dispose();
          subscriptionRef.current = null;
        }
        // Always reset state — even if cleanup already nulled the ref,
        // the hook's output should reflect "no active subscription".
        setData(null);
        setError(null);
        setIsSubscribed(false);
        return;
      }

      // Create new subscription.
      // Wrap parser and callbacks via refs so the subscription always
      // uses the latest version without needing to tear down and recreate
      // when only the parser or callbacks change.
      const currentConfig = configRef.current;
      /** Invalidate all configured TanStack Query cache keys (shared by onData + onReconnect). */
      const invalidateCaches = () => {
        const opts = optionsRef.current;
        if (opts.invalidate && opts.queryClient && opts.invalidateKeys) {
          for (const key of opts.invalidateKeys) {
            opts.queryClient.invalidateQueries({ queryKey: [...key] });
          }
        }
      };

      const subscription = client.createSubscription<TResult, TVariables, TRaw, TParsed>(
        {
          ...currentConfig,
          parser: (raw: TRaw[]) => configRef.current.parser(raw),
        },
        {
          enabled,
          onData: (newData: TParsed[]) => {
            invalidateCaches();
            optionsRef.current.onData?.(newData);
          },
          onReconnect: () => {
            // Invalidate on reconnect — data may be stale after disconnect
            invalidateCaches();
            optionsRef.current.onReconnect?.();
          },
        },
      );

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
    }, [config.document, stableVariables, options.enabled, client]);

    return {
      data,
      isConnected,
      isSubscribed,
      error,
    };
  };
}
