import { defineConfig, type Options } from 'tsup';

const sharedExternal = [
  'react',
  '@tanstack/react-query',
  'graphql-ws',
  'next-safe-action',
  'zod',
  'server-only',
];

export default defineConfig([
  // Main entry — client hooks + services + types + errors
  // Needs "use client" because it exports hooks that use React.
  // Banner is injected via esbuild; treeshake disabled to prevent rollup from stripping it.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: sharedExternal,
  } satisfies Options,
  // Server entry — no "use client" banner
  {
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: sharedExternal,
  } satisfies Options,
  // Types entry — pure types, no runtime, no banner
  {
    entry: { types: 'src/types.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', '@tanstack/react-query'],
  } satisfies Options,
]);
