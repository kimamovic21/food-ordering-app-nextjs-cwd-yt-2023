# Project Instructions For Gemini Workflows

## Stack Profile

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui components
- MongoDB via Mongoose (`models/`)
- NextAuth auth flows (`libs/authOptions.ts`, `app/api/auth/**`)
- TanStack Query client data cache for cache/refetch/invalidation flows
- nuqs URL state for shareable filters/search/sort/pagination
- cmdk for command palette and searchable action-menu patterns
- react-error-boundary for localized client component fallbacks
- Vercel Web Analytics for production traffic insights
- Stripe payments (`app/api/checkout/**`, `app/api/payment-link/**`, `app/api/webhook/**`)
- Resend email integration (`libs/sendPurchaseReceiptEmail.tsx`)
- Upstash Redis rate limiting (`libs/rateLimit.ts`)
- date-fns date formatting (`libs/dateFormat.ts`)
- Order operations: best coupon suggestion, reorder validation, restaurant accepting-order checks, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin completion, support tickets, and late-order alerts

## Coding Expectations

- Use incremental commits and low-risk changes.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch.
- Respect existing code organization and naming patterns.
- Reuse business logic from `libs/` and existing contexts.
- Use TanStack Query for client-side server state that benefits from cache, refetch, invalidation, optimistic updates, or polling. Keep message inbox/thread views, favorite ID/list views, and shared keys in `libs/queryKeys.ts`.
- `NuqsAdapter` is mounted in `app/layout.tsx`; use `nuqs` for URL-backed filters, sorting, search, selected ticket links, report periods, and pagination when the state should survive refresh/share.
- `components/shared/AppCommandPalette.tsx` uses `cmdk`; add important new routes/actions there when adding major navigation surfaces.
- `components/shared/AppErrorBoundary.tsx` uses `react-error-boundary` and reports caught client render errors to Sentry; keep it for client recovery, not API validation.
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts`.
- Keep strong typing and avoid implicit any.

## Risk Controls

- Never leak server secrets into client bundles.
- Keep role checks intact for admin, courier, and user routes.
- Keep checkout accepting-order checks in place before Stripe sessions are created: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Treat best coupon suggestions as UI help only; checkout must revalidate coupons server-side.
- Reorder flows must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Keep delivery completion double-confirmed with courier PIN handoff followed by customer/admin finalization.
- Keep support tickets scoped between restaurant support and app support.
- Keep ETA-style notifications and late active-order alerts aligned with order timeline state; failed-delivery review notifications should route restaurant admins to `/admin-dashboard/orders/[id]`.
- Keep SSE realtime updates role-scoped and fallback-friendly; streams should signal clients to refresh existing source-of-truth JSON endpoints.
- Prefer invalidating TanStack Query keys from SSE handlers instead of manually duplicating cached server state.
- Keep Sentry instrumentation files and env vars aligned; `SENTRY_AUTH_TOKEN` is secret and only for source map uploads during builds.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
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
- For order-flow work, cover checkout validation, coupon suggestion, restaurant availability, notification copy, courier summaries, and lifecycle transitions.
- Use `npm run test:e2e` for register/login and other real DB flow validation.
