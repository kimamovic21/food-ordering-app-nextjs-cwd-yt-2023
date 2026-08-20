import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const optionalBooleanString = z.enum(['true', 'false']).optional();
const optionalEmail = z.string().email().optional();
const optionalUrl = z.string().url().optional();
const optionalString = z.string().min(1).optional();

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MONGODB_URL: optionalString,
    MONGODB_URL_TESTS: optionalString,
    NEXTAUTH_URL: optionalUrl,
    NEXTAUTH_SECRET: optionalString,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    STRIPE_PK: optionalString,
    STRIPE_SK: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    RESEND_API_KEY: optionalString,
    SENDER_EMAIL: optionalEmail,
    RESEND_RECEIVER_EMAIL: optionalEmail,
    SKIP_VERIFY_EMAIL: optionalBooleanString,
    OPEN_AI_API_KEY: optionalString,
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    SENTRY_DSN: optionalUrl,
    SENTRY_AUTH_TOKEN: optionalString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: optionalUrl,
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: optionalEmail,
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URL: process.env.MONGODB_URL,
    MONGODB_URL_TESTS: process.env.MONGODB_URL_TESTS,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    STRIPE_PK: process.env.STRIPE_PK,
    STRIPE_SK: process.env.STRIPE_SK,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    RESEND_RECEIVER_EMAIL: process.env.RESEND_RECEIVER_EMAIL,
    SKIP_VERIFY_EMAIL: process.env.SKIP_VERIFY_EMAIL,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
});
