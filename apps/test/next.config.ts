import createMDX from '@next/mdx';
import { resolve } from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  transpilePackages: [
    '@lsp-indexer/types',
    '@lsp-indexer/node',
    '@lsp-indexer/react',
    '@lsp-indexer/next',
  ],
  outputFileTracingRoot: resolve(import.meta.dirname, '../../'),
  env: {
    NEXT_PUBLIC_INDEXER_URL: process.env.NEXT_PUBLIC_INDEXER_URL,
    NEXT_PUBLIC_INDEXER_WS_URL: process.env.NEXT_PUBLIC_INDEXER_WS_URL,
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
