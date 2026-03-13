import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    '@chillwhales/erc725',
    '@chillwhales/lsp1',
    '@lsp-indexer/types',
    'graphql',
    'graphql-request',
    'graphql-ws',
    'zod',
  ],
});
