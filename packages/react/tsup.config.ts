import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry — client hooks + services + types + errors
  // Needs "use client" because it exports hooks that use React
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: [
      'react',
      '@tanstack/react-query',
      'graphql-ws',
      'next-safe-action',
      'zod',
      'server-only',
    ],
    treeshake: true,
  },
  // Server entry — no "use client" banner
  {
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: [
      'react',
      '@tanstack/react-query',
      'graphql-ws',
      'next-safe-action',
      'zod',
      'server-only',
    ],
    treeshake: true,
  },
  // Types entry — pure types, no runtime, no banner
  {
    entry: { types: 'src/types.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', '@tanstack/react-query'],
  },
]);
