/** Root layout — app shell with provider tree. */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { RootProvider } from 'fumadocs-ui/provider';

import { getEnvAvailability } from '@/lib/env-config';

import './globals.css';
import { AppShell } from './app-shell';
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
          <AppShell envAvailability={envAvailability}>
            <RootProvider>{children}</RootProvider>
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
