'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { SubscriptionClient } from './client';
import { SubscriptionClientContext } from './context';

interface IndexerSubscriptionProviderProps {
  /**
   * WebSocket proxy URL. Defaults to '/api/graphql'.
   * This connects to your Next.js API route proxy, not directly to Hasura.
   *
   * **Must be stable for the provider's lifetime.** Changing `proxyUrl` after
   * mount has no effect — the client is created once and reused. To connect
   * to a different URL, remount the provider with a new `key`.
   */
  proxyUrl?: string;

  /**
   * Client authentication secret for connecting to the proxy.
   * Should match the secret configured in your proxy handler.
   *
   * In most cases, this can be omitted and will use the default secret
   * from NEXT_PUBLIC_LSP_INDEXER_CLIENT_SECRET environment variable.
   */
  authSecret?: string;

  children: ReactNode;
}

/**
 * Provides a shared WebSocket proxy connection to all subscription hooks in Next.js.
 *
 * This connects to `/api/graphql` (your proxy route) instead of directly to the
 * GraphQL endpoint, keeping the real Hasura URL hidden from the browser.
 *
 * Creates a single `SubscriptionClient` instance (via `useRef`) and disposes
 * it on unmount to close the WebSocket connection and release timers.
 *
 * Place inside your QueryClientProvider (for cache invalidation support):
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <IndexerSubscriptionProvider>
 *     <App />
 *   </IndexerSubscriptionProvider>
 * </QueryClientProvider>
 * ```
 */
export function IndexerSubscriptionProvider({
  proxyUrl = '/api/graphql',
  authSecret,
  children,
}: IndexerSubscriptionProviderProps) {
  const clientRef = useRef<SubscriptionClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new SubscriptionClient(proxyUrl, authSecret);
  }

  // Dispose the WebSocket client on unmount to avoid connection/timer leaks
  useEffect(() => {
    const client = clientRef.current;
    return () => {
      client?.dispose();
    };
  }, []);

  return (
    <SubscriptionClientContext.Provider value={clientRef.current}>
      {children}
    </SubscriptionClientContext.Provider>
  );
}
