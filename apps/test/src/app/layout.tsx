/**
 * Root Layout — app shell with sidebar navigation and provider tree.
 *
 * Server component that wraps all pages with:
 * - `<Providers>` — QueryClient, SubscriptionProviders, ThemeProvider
 * - `<AppSidebar>` — shadcn/ui sidebar with domain navigation links
 * - `<SidebarInset>` — content area with header breadcrumb and main content slot
 *
 * Uses Next.js metadata API for page title and description.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LSP Indexer React — Test App',
  description: 'Dev playground for testing @lsp-indexer/react hooks',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <span className="text-sm text-muted-foreground">@lsp-indexer/react playground</span>
              </header>
              <main className="flex-1 min-w-0 p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
