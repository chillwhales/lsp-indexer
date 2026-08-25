import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/app/**',
        'src/db/client.ts',
        'src/db/migrate.ts',
        'src/db/readiness.ts',
        // Live schema validation runs against Hasura in the API contract suite.
        'src/api/schema.ts',
        // SQL locking, paging, finality, and settlement paths run in the PostgreSQL suite.
        'src/metadata/queue.ts',
        'src/projections/metadataRecovery.ts',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
