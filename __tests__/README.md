# Test Suite Guide

This folder contains unit tests grouped by feature area.

## Current Coverage

 `api/payment.test.ts`: validates payment business logic including coupon validation, loyalty calculation, webhook processing, and order validation rules.
 `api/profile-change-password.route.test.ts`: validates password change API behavior.

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

## E2E Tests

- End-to-end style tests are kept in `e2e/`.
- See `e2e/README.md` for e2e commands and behavior.

## Environment

- Tests use `MONGODB_URL_TESTS` when available.
- If missing, setup falls back to the local default test DB URL.
