'use client';

/**
 * Client providers.
 *
 * Subscriptions use @lsp-indexer/react with NEXT_PUBLIC_INDEXER_WS_URL pointed at
 * the WS proxy to keep the upstream Hasura URL hidden from the browser.
 */
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
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
            staleTime: 60_000,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <IndexerSubscriptionProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </IndexerSubscriptionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
