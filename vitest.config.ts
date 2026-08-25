import { defineConfig } from 'vitest/config';

const includeIndexerV3 = process.env.INCLUDE_INDEXER_V3 !== 'false';

export default defineConfig({
  test: {
    projects: [
      'packages/types',
      'packages/node',
      'packages/react',
      'packages/next',
      ...(includeIndexerV3 ? ['packages/indexer-v3'] : []),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
      include: [
        'packages/types/src/**/*.ts',
        'packages/node/src/**/*.ts',
        'packages/react/src/**/*.{ts,tsx}',
        'packages/next/src/**/*.{ts,tsx}',
        ...(includeIndexerV3 ? ['packages/indexer-v3/src/**/*.ts'] : []),
      ],
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        'packages/indexer-v3/src/app/**',
      ],
    },
  },
});
