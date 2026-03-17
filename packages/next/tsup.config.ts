import { defineConfig } from 'tsup';

export default defineConfig([
  // Client hooks — 'use client' banner
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    banner: { js: '"use client";' },
    external: [
      'react',
      'next',
      '@tanstack/react-query',
      '@lsp-indexer/next/actions',
      '@lsp-indexer/node',
      '@lsp-indexer/react',
      '@lsp-indexer/types',
      'ws',
      'zod',
    ],
  },
  // Server actions — 'use server' banner
  {
    entry: { actions: 'src/actions/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    banner: { js: '"use server";' },
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
  // Server utilities (WS proxy) — no banner
  {
    entry: { server: 'src/server.ts' },
    format: ['esm'],
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
