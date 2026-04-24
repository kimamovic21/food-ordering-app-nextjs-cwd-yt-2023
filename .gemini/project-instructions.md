# Project Instructions For Gemini Workflows

## Stack Profile

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui components
- MongoDB via Mongoose (`models/`)
- NextAuth auth flows (`libs/authOptions.ts`, `app/api/auth/**`)
- Stripe payments (`app/api/checkout/**`, `app/api/payment-link/**`, `app/api/webhook/**`)
- Resend email integration (`libs/sendPurchaseReceiptEmail.tsx`)

## Coding Expectations

- Use incremental commits and low-risk changes.
- Respect existing code organization and naming patterns.
- Reuse business logic from `libs/` and existing contexts.
- Keep strong typing and avoid implicit any.

## Risk Controls

- Never leak server secrets into client bundles.
- Keep role checks intact for admin, courier, and user routes.
- Keep webhook logic idempotent and safe on retries.
- Ask before schema-level changes or backfills that may impact production data.

## Validation Workflow

- Execute `npm run lint` for meaningful code edits.
- Execute `npm run test` for auth and API behavior changes.
- Update `example.env` if any env contract changes.
- Update top-level docs when adding major features or integrations.

## Test Workflow

- Test runner: Vitest.
- Test folders: `__tests__/` for unit tests, `mocks/` for fixtures, `e2e/` for real-flow tests.
- Single-file execution: `npm run test:file -- <path>`.
- Prefer behavior-focused tests that cover success and failure paths.
- Use `npm run test:e2e` for register/login and other real DB flow validation.
