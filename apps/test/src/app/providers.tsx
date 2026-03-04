'use client';

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
