import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: [
      'react',
      'next',
      '@tanstack/react-query',
      '@lsp-indexer/node',
      '@lsp-indexer/react',
      '@lsp-indexer/types',
      'ws',
      'zod',
    ],
  },
  {
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: [
      'react',
      'next',
      '@tanstack/react-query',
      '@lsp-indexer/node',
      '@lsp-indexer/react',
      '@lsp-indexer/types',
      'ws',
      'zod',
    ],
  },
]);
