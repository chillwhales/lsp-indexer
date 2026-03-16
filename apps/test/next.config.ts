import { resolve } from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
    INDEXER_URL: process.env.INDEXER_URL,
    INDEXER_WS_URL: process.env.INDEXER_WS_URL,
    INDEXER_ALLOWED_ORIGINS: process.env.INDEXER_ALLOWED_ORIGINS,
  },
};

export default nextConfig;
