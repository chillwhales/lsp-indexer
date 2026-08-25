import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    environment: 'node',
    include: ['src/api/**/*.integration.test.ts'],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});

export default config;
