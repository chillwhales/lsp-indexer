'use client';

import { useRef } from 'react';
import { SubscriptionClient } from './client';
import { SubscriptionClientContext } from './context';

interface IndexerSubscriptionProviderProps {
  /** Optional explicit WebSocket URL. If omitted, derived from NEXT_PUBLIC_INDEXER_WS_URL or NEXT_PUBLIC_INDEXER_URL */
  wsUrl?: string;
  children: React.ReactNode;
}

/**
 * Provides a shared WebSocket subscription client to all subscription hooks.
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

  return (
    <SubscriptionClientContext.Provider value={clientRef.current}>
      {children}
    </SubscriptionClientContext.Provider>
  );
}
