import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['e2e/**/*.e2e.test.ts'],
    setupFiles: ['e2e/setup.e2e.ts'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'mocks/server-only.ts'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
