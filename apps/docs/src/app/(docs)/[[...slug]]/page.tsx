import { DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DocsToc } from '@/components/docs-toc';
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
      <DocsToc toc={page.data.toc} />
    </div>
  );
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams();
}
