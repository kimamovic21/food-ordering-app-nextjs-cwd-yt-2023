# Project Instructions For Claude Workflows

## Technical Context

- Framework: Next.js 16 App Router + React 19 + TypeScript
- Data layer: MongoDB with Mongoose models in `models/`
- Auth: NextAuth with MongoDB adapter and Google OAuth
- Payments: Stripe checkout + payment link + webhook routes
- Email: Resend + React Email
- Images: Cloudinary
- Mapping: Leaflet + React Leaflet
- Rate limiting: Upstash Redis for short-lived counters on sensitive routes
- Date formatting: date-fns through `libs/dateFormat.ts`
- Order operations: best coupon suggestion, reorder validation, restaurant accepting-order checks, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin completion, support tickets, and late-order alerts

## Implementation Rules

- Keep edits small and composable.
- Preserve existing API shapes unless explicitly requested.
- Reuse helpers in `libs/` before adding new utilities.
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts`.
- Avoid `any`; prefer explicit typing and narrow unions.

## Safety Rules

- Secrets must remain server-side.
- Treat auth, payments, and courier flows as sensitive paths.
- Keep checkout accepting-order checks in place before Stripe sessions are created: working hours, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Treat best coupon suggestions as UI help only; checkout must revalidate coupons server-side.
- Reorder flows must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Keep delivery completion double-confirmed with courier PIN handoff followed by customer/admin finalization.
- Keep support tickets scoped between restaurant support and app support.
- Keep ETA-style notifications and late active-order alerts aligned with order timeline state; failed-delivery review notifications should route restaurant admins to `/admin-dashboard/orders/[id]`.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
- Keep webhook and async job processing idempotent.
- Never perform destructive DB changes without explicit approval.

## Required Validation

- Run `npm run lint` after non-trivial changes.
- Run `npm run test` when changing auth or API business logic.
- If environment variables change, update `example.env`.
- If adding major functionality, update docs in `README.md` and AI guidance files.

## Test Workflow

- Test runner: Vitest.
- Test folders: `__tests__/` for unit tests, `mocks/` for fixtures, `e2e/` for real-flow tests.
- Use `npm run test:file -- <path>` to run one file during iteration.
- Keep tests deterministic and focused on route/auth behavior contracts.
- For order-flow work, cover checkout validation, coupon suggestion, restaurant availability, notification copy, courier summaries, and lifecycle transitions.
- Use `npm run test:e2e` for database-backed flows and keep cleanup in test code.
