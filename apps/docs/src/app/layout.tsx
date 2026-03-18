/** Root layout — app shell with provider tree, sidebar, and header. */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import { RootProvider } from 'fumadocs-ui/provider';

import { EnvProvider } from '@/components/env-provider';
import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getEnvAvailability } from '@/lib/env-config';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LSP Indexer Docs',
  description: 'Developer documentation and playground for @lsp-indexer',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  const envAvailability = getEnvAvailability();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <RootProvider>
            <EnvProvider value={envAvailability}>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <span className="text-sm font-medium">@lsp-indexer</span>
                    <div className="ml-auto">
                      <LargeSearchToggle />
                    </div>
                  </header>
                  <main className="flex-1 min-w-0">{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </EnvProvider>
          </RootProvider>
        </Providers>
      </body>
    </html>
  );
}
