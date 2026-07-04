# Test Suite Guide

This folder contains unit tests grouped by feature area.

## Current Coverage

- `auth/credentials-authorize.test.ts`: validates credentials authorization behavior.
- `api/register.route.test.ts`: validates registration rules and role assignment.
- `api/verify-email.route.test.ts`: validates verification-token route behavior.
- `api/forgot-password.route.test.ts`: validates forgot-password route behavior.
- `api/reset-password.route.test.ts`: validates reset-password route behavior.
- `api/profile.route.test.ts`: validates profile fetch/update/delete behavior.
- `api/profile-change-password.route.test.ts`: validates password change API behavior.
- `api/upload-users.route.test.ts`: validates profile image upload/remove behavior.
- `api/checkout.route.test.ts`: validates checkout guardrails and failure handling.
- `api/courier-earnings.route.test.ts`: validates courier earnings access and summaries.
- `api/my-deliveries.route.test.ts`: validates courier delivery history and performance summaries.
- `api/restaurant.route.test.ts`: validates restaurant settings, ownership, and deletion behavior.
- `api/webhook.route.test.ts`: validates webhook signature/idempotency behavior.
- `api/payment.test.ts`: validates payment-related helper logic and utility contracts.

## Structure Rules

- Keep test files close to business domain in nested folders.
- Name test files with `*.test.ts`.
- Put reusable input fixtures in the root `mocks/` folder.
- Focus on behavior contracts, not implementation details.

## Running Tests

- Run all tests: `npm run test`
- Watch mode: `npm run test:watch`
- Run a single test file: `npm run test:file -- __tests__/api/register.route.test.ts`
- Run profile unit tests: `npm run test:profile`
- Run payment/webhook-focused unit tests: `npm run test:payment`

## E2E Tests

- End-to-end style tests are kept in `e2e/`.
- See `e2e/README.md` for e2e commands and behavior.

## Environment

- Tests use `MONGODB_URL_TESTS` when available.
- If missing, setup falls back to the local default test DB URL.
