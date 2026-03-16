import type { ReactNode } from 'react';

import { TableOfContents } from '@/components/table-of-contents';

/** Docs layout — centered content with TOC on the right, equal spacing on both sides. */
export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex justify-center gap-10">
      <article className="prose prose-neutral dark:prose-invert min-w-0 max-w-3xl flex-1 prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal">
        {children}
      </article>
      <aside className="hidden w-52 shrink-0 xl:block">
        <TableOfContents />
      </aside>
    </div>
  );
}
