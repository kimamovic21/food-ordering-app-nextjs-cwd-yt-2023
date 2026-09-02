import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['__tests__/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'mocks/server-only.ts'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
