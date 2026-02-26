import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'zod',
    '@lukso/lsp0-contracts',
    '@lukso/lsp7-contracts',
    '@lukso/lsp8-contracts',
    '@lukso/lsp9-contracts',
    '@lukso/lsp14-contracts',
    '@lukso/lsp26-contracts',
  ],
});
