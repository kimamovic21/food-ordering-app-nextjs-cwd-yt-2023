# Project Instructions For Claude Workflows

## Technical Context

- Framework: Next.js 16 App Router + React 19 + TypeScript
- Data layer: MongoDB with Mongoose models in `models/`
- Auth: NextAuth with MongoDB adapter and Google OAuth
- Payments: Stripe checkout + payment link + webhook routes
- Email: Resend + React Email
- Images: Cloudinary
- Mapping: Leaflet + React Leaflet

## Implementation Rules

- Keep edits small and composable.
- Preserve existing API shapes unless explicitly requested.
- Reuse helpers in `libs/` before adding new utilities.
- Avoid `any`; prefer explicit typing and narrow unions.

## Safety Rules

- Secrets must remain server-side.
- Treat auth, payments, and courier flows as sensitive paths.
- Keep webhook and async job processing idempotent.
- Never perform destructive DB changes without explicit approval.

## Required Validation

- Run `npm run lint` after non-trivial changes.
- Run `npm run test` when changing auth or API business logic.
- If environment variables change, update `example.env`.
- If adding major functionality, update docs in `README.md` and AI guidance files.

## Test Workflow

- Test runner: Vitest.
- Test folders: `__tests__/` for tests, `mocks/` for fixtures.
- Use `npm run test:file -- <path>` to run one file during iteration.
- Keep tests deterministic and focused on route/auth behavior contracts.
