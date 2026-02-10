import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Unit tests in src/**/*.test.ts run against source
    // Integration tests in test/**/*.test.ts import from @/ (compiled lib/)
    // and discover *.plugin.js / *.handler.js from lib/
    // NOTE: Integration tests require `pnpm build` to run first
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      // Integration tests use @/ alias to import from compiled lib/
      '@/': path.resolve(__dirname, 'lib') + '/',
    },
  },
});
