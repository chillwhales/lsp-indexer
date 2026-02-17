import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Nav } from '@/components/nav';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LSP Indexer React — Test App',
  description: 'Dev playground for testing @lsp-indexer/react hooks',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <Providers>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Nav />
            <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
