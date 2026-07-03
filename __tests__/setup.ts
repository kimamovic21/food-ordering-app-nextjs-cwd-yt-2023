import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { server } from '@/mocks/server';

vi.mock('server-only', () => ({}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Set MONGODB_URL for tests (uses env var if available, otherwise dummy URL for mocking)
if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS ||
    'mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests';
}

beforeEach(() => {
  vi.clearAllMocks();
});
