import { defineConfig, type Options } from 'tsup';

const sharedExternal = [
  'react',
  '@tanstack/react-query',
  '@lsp-indexer/node',
  '@lsp-indexer/types',
  'zod',
];

export default defineConfig([
  // Main entry — client hooks
  // Needs "use client" because it exports hooks that use React.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: sharedExternal,
  } satisfies Options,
  // Server entry — re-exports from @lsp-indexer/node (backward compat)
  {
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: sharedExternal,
  } satisfies Options,
  // Types entry — re-exports from @lsp-indexer/types (backward compat)
  {
    entry: { types: 'src/types.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: sharedExternal,
  } satisfies Options,
]);
