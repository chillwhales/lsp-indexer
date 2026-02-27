import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'next',
    '@tanstack/react-query',
    '@lsp-indexer/node',
    '@lsp-indexer/types',
    'graphql-ws',
    'ws',
    'zod',
  ],
});
