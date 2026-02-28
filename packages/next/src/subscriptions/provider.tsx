'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { SubscriptionClient } from './client';
import { SubscriptionClientContext } from './context';

interface IndexerSubscriptionProviderProps {
  /**
   * WebSocket proxy URL. Defaults to '/api/graphql'.
   * This connects to your Next.js WebSocket proxy, not directly to the
   * upstream GraphQL endpoint.
   *
   * **Must be stable for the provider's lifetime.** Changing `proxyUrl` after
   * mount has no effect — the client is created once and reused. To connect
   * to a different URL, remount the provider with a new `key`:
   *
   * ```tsx
   * <IndexerSubscriptionProvider key={proxyUrl} proxyUrl={proxyUrl}>
   * ```
   */
  proxyUrl?: string;

  children: ReactNode;
}

/**
 * Provides a shared WebSocket proxy connection to all subscription hooks in Next.js.
 *
 * This connects to `/api/graphql` (your proxy) instead of directly to the
 * GraphQL endpoint, keeping the real upstream URL hidden from the browser.
 * Access control is handled by the proxy via Origin header validation.
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
  children,
}: IndexerSubscriptionProviderProps) {
  const clientRef = useRef<SubscriptionClient | null>(null);
  const initialUrlRef = useRef(proxyUrl);

  if (!clientRef.current) {
    clientRef.current = new SubscriptionClient(proxyUrl);
  }

  // Warn in development if proxyUrl changes after mount (it has no effect).
  if (process.env.NODE_ENV !== 'production' && proxyUrl !== initialUrlRef.current) {
    console.warn(
      '[IndexerSubscriptionProvider] proxyUrl changed after mount ' +
        `("${initialUrlRef.current}" → "${proxyUrl}"). This has no effect — ` +
        'the client is created once. To change URLs, remount with a new `key` prop.',
    );
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
