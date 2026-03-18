import type { MDXComponents } from 'mdx/types';
import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { Mermaid } from '@/components/mermaid';

/** Convert heading text to a URL-friendly slug. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Extract plain text from React children (handles nested elements). */
function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return extractText(children.props.children);
  }
  return '';
}

/** Create a heading component with auto-generated id for TOC linking. */
function createHeading(level: 2 | 3) {
  const Tag = `h${level}` as const;
  return function Heading({ children, ...props }: ComponentPropsWithoutRef<'h2'>) {
    const text = extractText(children);
    const id = slugify(text);
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h2: createHeading(2),
    h3: createHeading(3),
    pre: ({ children }: ComponentPropsWithoutRef<'pre'>) => {
      if (!isValidElement<{ children?: string; className?: string }>(children)) {
        return <pre>{children}</pre>;
      }
      const { children: code, className } = children.props;
      const text = typeof code === 'string' ? code.trimEnd() : '';
      const lang = (className ?? '').replace(/language-/, '') || 'text';

      // Render mermaid code blocks as diagrams
      if (lang === 'mermaid') {
        return <Mermaid chart={text} />;
      }

      return <CodeBlock code={text} lang={lang} />;
    },
  };
}
