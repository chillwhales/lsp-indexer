import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/types', 'packages/node', 'packages/react', 'packages/next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
      include: [
        'packages/types/src/**/*.ts',
        'packages/node/src/**/*.ts',
        'packages/react/src/**/*.{ts,tsx}',
        'packages/next/src/**/*.{ts,tsx}',
      ],
      exclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.{ts,tsx}'],
    },
  },
});
