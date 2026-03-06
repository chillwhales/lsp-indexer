'use client';

/**
 * Client Providers — configures QueryClient and dual SubscriptionProviders for the test app.
 *
 * **Provider stack (outer → inner):**
 * 1. `ThemeProvider` — next-themes for dark/light mode
 * 2. `QueryClientProvider` — TanStack Query with 1-minute stale time
 * 3. `ReactSubscriptionProvider` — `@lsp-indexer/react` WebSocket context (direct client)
 * 4. `NextSubscriptionProvider` — `@lsp-indexer/next` WebSocket context (via proxy URL)
 * 5. `TooltipProvider` — shadcn/ui tooltip context
 *
 * Both subscription providers are mounted so pages can toggle between
 * `@lsp-indexer/react` (direct WebSocket) and `@lsp-indexer/next` (proxy) modes.
 */
import { IndexerSubscriptionProvider as NextSubscriptionProvider } from '@lsp-indexer/next';
import { IndexerSubscriptionProvider as ReactSubscriptionProvider } from '@lsp-indexer/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: ReactNode }): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 minute — blockchain data doesn't change rapidly
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ReactSubscriptionProvider>
          <NextSubscriptionProvider proxyUrl="ws://localhost:4000">
            <TooltipProvider>{children}</TooltipProvider>
          </NextSubscriptionProvider>
        </ReactSubscriptionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
