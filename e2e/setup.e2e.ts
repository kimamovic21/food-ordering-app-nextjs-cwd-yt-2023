import { afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (!process.env.MONGODB_URL_TESTS && fs.existsSync(envLocalPath)) {
  const envLines = fs.readFileSync(envLocalPath, 'utf-8').split(/\r?\n/);
  const mongoLine = envLines.find((line) => line.startsWith('MONGODB_URL_TESTS='));

  if (mongoLine) {
    process.env.MONGODB_URL_TESTS = mongoLine.slice('MONGODB_URL_TESTS='.length).trim();
  }
}

if (!process.env.MONGODB_URL_TESTS) {
  throw new Error(
    'MONGODB_URL_TESTS is required for e2e tests. Set it in .env.local or your shell environment.'
  );
}

process.env.MONGODB_URL = process.env.MONGODB_URL_TESTS;
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'e2e-test-secret';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'e2e-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'e2e-google-client-secret';

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
