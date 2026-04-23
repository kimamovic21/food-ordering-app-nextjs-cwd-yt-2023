# Testing Strategy (Next.js App)

This project uses Vitest for fast TypeScript tests.

## Why Start With Register/Login

Auth is a high-value and high-risk area. Testing register and login first gives confidence in:

- input validation
- duplicate-email protection
- password verification behavior
- user role assignment for first-user bootstrap

## Current Test Scope

- Unit-level behavior tests for:
  - `app/api/register/route.ts`
  - credentials `authorize` handler in `libs/authOptions.ts`

These tests intentionally avoid changing existing runtime auth code.

## Folder Layout

- `__tests__/`: all test files by domain
- `mocks/`: reusable mock fixtures and sample payloads

## Best Practices For This Repository

- Add tests for critical flows first (auth, checkout, webhooks).
- Keep mocks realistic, but minimal.
- Use stable data fixtures from `mocks/` to avoid repetition.
- Test success and failure paths for each route/handler.
- Avoid brittle UI snapshots for server business logic.
- Keep tests deterministic and fast.

## Commands

- `npm run test`: run all tests once
- `npm run test:watch`: run in watch mode
- `npm run test:file -- <path>`: run only one file
- `npm run test:auth`: run only auth-focused tests

## Environment Variables

In local development, add this to `.env.local`:

- `MONGODB_URL_TESTS=mongodb://localhost:27017/[your-database-name]`

Test setup will use:

1. `MONGODB_URL` if already set
2. otherwise `MONGODB_URL_TESTS` (required; no fallback)
