import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    exclude: ['src/api/**/*.integration.test.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});

export default config;
