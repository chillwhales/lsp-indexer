import { TOCItems, Toc } from 'fumadocs-ui/components/layout/toc';
import { DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { source } from '@/lib/source';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) notFound();

  const Mdx = page.data.body;

  return (
    <div className="flex flex-row gap-6 p-6 max-w-screen-xl mx-auto w-full">
      <article className="flex-1 min-w-0">
        <DocsBody>
          <Mdx />
        </DocsBody>
      </article>
      {page.data.toc.length > 0 && (
        <Toc className="hidden xl:flex w-56 shrink-0 flex-col gap-3 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
          <p className="text-sm font-medium text-foreground">On this page</p>
          <TOCItems items={page.data.toc} />
        </Toc>
      )}
    </div>
  );
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams();
}
