import type { ReactNode } from 'react';

/** Home layout — prose-styled MDX content, centered. */
export default function HomeLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal">
      {children}
    </article>
  );
}
