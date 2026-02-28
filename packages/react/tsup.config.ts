import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  banner: { js: '"use client";' },
  external: ['react', '@tanstack/react-query', '@lsp-indexer/node', '@lsp-indexer/types', 'zod'],
});
