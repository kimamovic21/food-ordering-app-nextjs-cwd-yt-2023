# E2E Tests Guide

This folder contains end-to-end style tests for critical user flows using a real test database.

## Current Coverage

- `auth/register-login.e2e.test.ts`
  - register user flow with DB persistence checks
  - credentials login flow through NextAuth authorize handler
  - duplicate email registration protection
- `auth/verify-email.e2e.test.ts`
  - verification-required registration behavior
  - login blocked before email verification
  - resend verification flow
  - invalid/expired verification token behavior
- `auth/forgot-password.e2e.test.ts`
  - forgot-password behavior for credentials users
  - oauth account reset restrictions
  - reset-password flow and login with updated credentials
- `profile/profile-management.e2e.test.ts`
  - profile info update flow
  - profile image upload/remove flow
  - account deletion flow
- `checkout/checkout-payment.e2e.test.ts`
  - order and payment data integration checks against persisted models
  - coupon and cross-restaurant data validation checks
  - ownership-rule related data integrity checks

Notes:

- Current checkout e2e tests are integration-style DB tests and do not directly invoke checkout/webhook route handlers.
- Route-level checkout/webhook guardrails are covered in unit route tests under `__tests__/api/`.

## Environment

E2E tests require:

- `MONGODB_URL_TESTS` in `.env.local`

Example:

- `MONGODB_URL_TESTS=mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests`

## Commands

- Run all e2e tests: `npm run test:e2e`
- Run one e2e file: `npm run test:e2e:file -- e2e/auth/register-login.e2e.test.ts`
- Run profile e2e tests: `npm run test:e2e:profile`
- Run checkout e2e tests: `npm run test:e2e:checkout`
- Run full test pipeline (unit + e2e): `npm run test:all`

## Best Practices

- Keep e2e scope focused on critical flows.
- Avoid asserting implementation details.
- Always clean up test-created data.
- Prefer unique emails or IDs per test execution.
