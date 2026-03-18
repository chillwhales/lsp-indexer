'use client';

import { AnchorProvider } from 'fumadocs-core/toc';
import { TOCItems, Toc } from 'fumadocs-ui/components/layout/toc';
import type { TOCItemType } from 'fumadocs-core/server';
import type { ReactNode } from 'react';

interface DocsTocProps {
  toc: TOCItemType[];
}

export function DocsToc({ toc }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <Toc className="hidden xl:flex w-56 shrink-0 flex-col gap-3 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
        <p className="text-sm font-medium text-foreground">On this page</p>
        <TOCItems items={toc} />
      </Toc>
    </AnchorProvider>
  );
}
