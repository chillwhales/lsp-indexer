'use client';

/**
 * Client providers — conditionally mounts subscription providers based on env availability.
 *
 * Subscription providers only mount when their respective WebSocket env vars are configured,
 * preventing runtime errors from missing connection URLs.
 */
import { IndexerSubscriptionProvider as NextSubscriptionProvider } from '@lsp-indexer/next';
import { IndexerSubscriptionProvider as ReactSubscriptionProvider } from '@lsp-indexer/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  /** Whether client-side WebSocket env vars are available. */
  hasClientWs: boolean;
  /** Whether server-side WebSocket env vars are available. */
  hasServerWs: boolean;
  /** WS proxy port for NextSubscriptionProvider (default 4000). */
  wsProxyPort: number;
  children: ReactNode;
}

export function Providers({
  hasClientWs,
  hasServerWs,
  wsProxyPort,
  children,
}: ProvidersProps): ReactNode {
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

  /** Wrap children in subscription providers only when WS env vars are available. */
  function wrapSubscriptionProviders(inner: ReactNode): ReactNode {
    let wrapped = inner;

    if (hasServerWs) {
      wrapped = (
        <NextSubscriptionProvider
          proxyUrl={`ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:${wsProxyPort}`}
        >
          {wrapped}
        </NextSubscriptionProvider>
      );
    }

    if (hasClientWs) {
      wrapped = <ReactSubscriptionProvider>{wrapped}</ReactSubscriptionProvider>;
    }

    return wrapped;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {wrapSubscriptionProviders(<TooltipProvider>{children}</TooltipProvider>)}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
