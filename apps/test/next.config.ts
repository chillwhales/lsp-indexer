import createMDX from '@next/mdx';
import { resolve } from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // All @lsp-indexer packages are pre-built by tsup — no transpilation needed.
  // Do NOT add them to transpilePackages: it inlines process.env at build time,
  // which leaks server-side env vars (INDEXER_URL) into the client bundle.
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
