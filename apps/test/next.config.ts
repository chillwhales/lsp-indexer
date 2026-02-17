import { resolve } from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lsp-indexer/react'],
  outputFileTracingRoot: resolve(import.meta.dirname, '../../'),
};

export default nextConfig;
