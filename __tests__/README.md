# Test Suite Guide

This folder contains unit tests grouped by feature area.

## Current Coverage

- `api/register.route.test.ts`: validates register API behavior.
- `auth/credentials-authorize.test.ts`: validates login credential authorization behavior.

## Structure Rules

- Keep test files close to business domain in nested folders.
- Name test files with `*.test.ts`.
- Put reusable input fixtures in the root `mocks/` folder.
- Focus on behavior contracts, not implementation details.

## Running Tests

- Run all tests: `npm run test`
- Watch mode: `npm run test:watch`
- Run a single test file: `npm run test:file -- __tests__/api/register.route.test.ts`

## E2E Tests

- End-to-end style tests are kept in `e2e/`.
- See `e2e/README.md` for e2e commands and behavior.

## Environment

- Tests use `MONGODB_URL_TESTS` when available.
- If missing, setup falls back to the local default test DB URL.
