/** Root layout — app shell with sidebar navigation and provider tree. */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { EnvProvider } from '@/components/env-provider';
import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getEnvAvailability } from '@/lib/env-config';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LSP Indexer React — Test App',
  description: 'Dev playground for testing @lsp-indexer/react hooks',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  const envAvailability = getEnvAvailability();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers
          hasClientWs={envAvailability.hasClientWs}
          hasServerWs={envAvailability.hasServerWs}
          wsProxyPort={envAvailability.wsProxyPort}
        >
          <EnvProvider value={envAvailability}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <span className="text-sm text-muted-foreground">
                    @lsp-indexer/react playground
                  </span>
                </header>
                <main className="flex-1 min-w-0 p-6">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </EnvProvider>
        </Providers>
      </body>
    </html>
  );
}
