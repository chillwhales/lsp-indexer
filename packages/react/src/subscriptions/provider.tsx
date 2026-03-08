'use client';

import { SubscriptionClient } from '@lsp-indexer/node';
import { useEffect, useRef, type ReactNode } from 'react';
import { SubscriptionClientContext } from './context';

interface IndexerSubscriptionProviderProps {
  /**
   * Optional explicit WebSocket URL. If omitted, derived from
   * NEXT_PUBLIC_INDEXER_WS_URL or NEXT_PUBLIC_INDEXER_URL.
   *
   * **Must be stable for the provider's lifetime.** Changing `wsUrl` after
   * mount has no effect — the client is created once and reused. To connect
   * to a different URL, remount the provider with a new `key`.
   */
  wsUrl?: string;
  children: ReactNode;
}

/**
 * Provides a shared WebSocket subscription client to all subscription hooks.
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
export function IndexerSubscriptionProvider({ wsUrl, children }: IndexerSubscriptionProviderProps) {
  const clientRef = useRef<SubscriptionClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new SubscriptionClient(wsUrl);
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
