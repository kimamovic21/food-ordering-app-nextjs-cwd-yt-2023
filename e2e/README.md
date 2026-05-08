# E2E Tests Guide

This folder contains end-to-end style tests for critical user flows using a real test database.

## Current Coverage

- `auth/register-login.e2e.test.ts`
  - register user flow with DB persistence checks
  - credentials login flow through NextAuth authorize handler
  - duplicate email registration protection
- `profile/profile-management.e2e.test.ts`
  - profile info update flow
  - profile image upload/remove flow
  - account deletion flow
- `checkout/checkout-payment.e2e.test.ts`
  - order creation with valid cart data
  - coupon discount application
  - payment status updates (order marked as paid after webhook)
  - multi-restaurant validation
  - user cannot order from own restaurant

## Environment

E2E tests require:

- `MONGODB_URL_TESTS` in `.env.local`

Example:

- `MONGODB_URL_TESTS=mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests`

## Commands

- Run all e2e tests: `npm run test:e2e`
- Run one e2e file: `npm run test:e2e:file -- e2e/auth/register-login.e2e.test.ts`
- Run profile e2e tests: `npm run test:e2e:profile`
- Run full test pipeline (unit + e2e): `npm run test:all`

## Best Practices

- Keep e2e scope focused on critical flows.
- Avoid asserting implementation details.
- Always clean up test-created data.
- Prefer unique emails or IDs per test execution.
