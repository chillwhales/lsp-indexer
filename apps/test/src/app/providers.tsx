'use client';

/**
 * Client providers — mounts subscription provider when WS env vars are configured.
 *
 * Uses @lsp-indexer/react subscription hooks for all subscriptions. When a WS proxy is
 * configured (server-side env vars), the provider connects through the proxy to keep the
 * Hasura URL hidden from the browser.
 *
 * Next.js does not support WebSocket connections in API routes, so subscriptions always use
 * the React subscription provider — either direct or through the WS proxy.
 */
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useMemo, useState, type ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  /** Whether server-side WS proxy is available (INDEXER_WS_URL or INDEXER_URL set). */
  hasServerWs: boolean;
  /** WS proxy port (default 4000). */
  wsProxyPort: number;
  children: ReactNode;
}

export function Providers({ hasServerWs, wsProxyPort, children }: ProvidersProps): ReactNode {
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

  // Build WS proxy URL client-side using the browser's hostname so it works
  // in both local dev (localhost) and production (your-domain.com).
  const wsUrl = useMemo(() => {
    if (!hasServerWs) return undefined;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${hostname}:${wsProxyPort}`;
  }, [hasServerWs, wsProxyPort]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <IndexerSubscriptionProvider wsUrl={wsUrl}>
          <TooltipProvider>{children}</TooltipProvider>
        </IndexerSubscriptionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
