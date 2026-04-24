import { beforeEach, vi } from 'vitest';

// Set MONGODB_URL for tests (uses env var if available, otherwise dummy URL for mocking)
if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS ||
    'mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests';
}

beforeEach(() => {
  vi.clearAllMocks();
});
