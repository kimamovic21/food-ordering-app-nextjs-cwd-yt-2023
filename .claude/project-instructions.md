# Project Instructions For Claude Workflows

## Technical Context

- Framework: Next.js 16 App Router + React 19 + TypeScript
- Client data cache: TanStack Query
- Data-table UX: TanStack Table through `components/shared/TanStackDataTable.tsx`
- URL state: nuqs
- Command UI: cmdk
- Client error fallback: react-error-boundary
- Analytics: Vercel Web Analytics and Vercel Speed Insights
- Data layer: MongoDB with Mongoose models in `models/`
- Auth: NextAuth with MongoDB adapter and Google OAuth
- Payments: Stripe checkout + payment link + webhook routes
- Email: Resend + React Email
- Images: Cloudinary
- Mapping: Leaflet + React Leaflet
- Rate limiting: Upstash Redis for short-lived counters on sensitive routes
- Background jobs: Upstash QStash for delayed order-maintenance checks
- Date formatting: date-fns and @date-fns/tz through `libs/dateFormat.ts`
- Money and phone helpers: currency.js through `libs/money.ts`, and libphonenumber-js through `libs/phone.ts`
- Order operations: best coupon suggestion, reorder validation, restaurant accepting-order checks, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin completion, support tickets, and late-order alerts

## Implementation Rules

- Keep edits small and composable.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch.
- Preserve existing API shapes unless explicitly requested.
- Reuse helpers in `libs/` before adding new utilities.
- Keep reusable domain, DTO, and API response types in `types/`; use lowercase feature filenames and PascalCase exported names. Keep one-off component props colocated with the component.
- Use TanStack Query for client-side server state that benefits from cache, refetch, invalidation, optimistic updates, or polling. Keep message inbox/thread views, favorite ID/list views, and shared keys in `libs/queryKeys.ts`.
- Use TanStack Table for larger list UIs that need search, sorting, pagination, or column visibility. Use simple mode without toolbar/pagination for small read-only detail tables such as order items. Keep mutations and row actions in the owning screen component.
- `NuqsAdapter` is mounted in `app/layout.tsx`; use `nuqs` for URL-backed filters, sorting, search, selected ticket links, report periods, and pagination when the state should survive refresh/share.
- `components/shared/AppCommandPalette.tsx` uses `cmdk`; add important new routes/actions there when adding major navigation surfaces.
- `components/shared/AppErrorBoundary.tsx` uses `react-error-boundary` and reports caught client render errors to Sentry; keep it for client recovery, not API validation.
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts`.
- Use `libs/money.ts` for business money calculations and `libs/phone.ts` before saving phone numbers.
- Avoid `any`; prefer explicit typing and narrow unions.

## Safety Rules

- Secrets must remain server-side.
- Treat auth, payments, and courier flows as sensitive paths.
- Keep checkout accepting-order checks in place before Stripe sessions are created: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Preserve checkout duplicate protection: recent identical unpaid `placed` attempts use `checkoutFingerprint` and should reuse or recover the existing Stripe Checkout session.
- Treat best coupon suggestions as UI help only; checkout must revalidate coupons server-side.
- Reorder flows must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Keep delivery completion double-confirmed with courier PIN handoff followed by customer/admin finalization.
- Keep support tickets scoped between restaurant support and app support.
- Keep ETA-style notifications and late active-order alerts aligned with order timeline state; failed-delivery review notifications should route restaurant admins to `/admin-dashboard/orders/[id]`.
- Keep QStash delayed job handlers server-only, signature-verified, idempotent, and fail-open around user-facing checkout/order status flows.
- Keep SSE realtime updates role-scoped and fallback-friendly; streams should signal clients to refresh existing source-of-truth JSON endpoints.
- Prefer invalidating TanStack Query keys from SSE handlers instead of manually duplicating cached server state.
- Keep Sentry instrumentation files and env vars aligned; `SENTRY_AUTH_TOKEN` is secret and only for source map uploads during builds. Session Replay should stay disabled in development and only run in production for sampled error sessions.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
- Keep webhook and async job processing idempotent.
- Never perform destructive DB changes without explicit approval.

## Required Validation

- Run `npm run lint` after non-trivial changes.
- Run `npm run test` when changing auth or API business logic.
- Run `npm run test:qstash` when changing delayed order-maintenance scheduling or the QStash receiver route.
- If environment variables change, update `example.env`.
- If adding major functionality, update docs in `README.md` and AI guidance files.

## Test Workflow

- Test runner: Vitest.
- Test folders: `__tests__/` for unit tests, `mocks/` for fixtures, `e2e/` for real-flow tests.
- Use `npm run test:file -- <path>` to run one file during iteration.
- Use `__tests__/utils/testFactories.ts` for generated fixtures and `__tests__/utils/mongoMemoryServer.ts` for isolated Mongo integration tests when needed.
- Keep tests deterministic and focused on route/auth behavior contracts.
- For order-flow work, cover checkout validation, coupon suggestion, restaurant availability, notification copy, courier summaries, and lifecycle transitions.
- Use `npm run test:e2e` for database-backed flows and keep cleanup in test code.
