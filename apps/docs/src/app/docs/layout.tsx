import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

import { source } from '@/lib/source';

/** Fumadocs docs layout — sidebar navigation, search, and syntax highlighting for /docs/*. */
export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: '@lsp-indexer',
      }}
    >
      {children}
    </DocsLayout>
  );
}
