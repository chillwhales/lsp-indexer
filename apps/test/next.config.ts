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
};

export default nextConfig;
