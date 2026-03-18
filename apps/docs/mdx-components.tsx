import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

import { Mermaid } from '@/components/mermaid';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => {
      // Intercept mermaid code blocks and render as diagrams
      const child = Array.isArray(children) ? children[0] : children;
      if (
        child &&
        typeof child === 'object' &&
        'props' in child &&
        typeof child.props?.className === 'string' &&
        child.props.className.includes('language-mermaid')
      ) {
        const text = typeof child.props.children === 'string' ? child.props.children.trimEnd() : '';
        return <Mermaid chart={text} />;
      }
      return defaultMdxComponents.pre({ children, ...props });
    },
  };
}
