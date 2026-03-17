'use client';

/**
 * Client providers — conditionally mounts subscription provider based on env availability.
 *
 * Uses @lsp-indexer/react subscription hooks for all subscriptions. When a WS proxy is
 * configured (server-side env vars), the provider connects through the proxy to keep the
 * Hasura URL hidden from the browser. Otherwise, it connects directly using the client-side
 * WebSocket URL.
 *
 * Next.js does not support WebSocket connections in API routes, so subscriptions always use
 * the React subscription provider — either direct or through the WS proxy.
 */
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  /** Whether WebSocket subscriptions are available (either client or server WS env vars). */
  hasWs: boolean;
  /**
   * WebSocket URL for subscriptions.
   * When WS proxy is available: `ws://hostname:4000` (Hasura URL stays hidden).
   * When only client WS is available: uses NEXT_PUBLIC_INDEXER_WS_URL directly.
   * Undefined when no WS env vars are configured.
   */
  wsUrl?: string;
  children: ReactNode;
}

export function Providers({ hasWs, wsUrl, children }: ProvidersProps): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
          },
        },
      }),
  );

  /** Wrap children in subscription provider only when WS is available. */
  function wrapSubscriptionProvider(inner: ReactNode): ReactNode {
    if (!hasWs) return inner;
    return <IndexerSubscriptionProvider wsUrl={wsUrl}>{inner}</IndexerSubscriptionProvider>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {wrapSubscriptionProvider(<TooltipProvider>{children}</TooltipProvider>)}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
