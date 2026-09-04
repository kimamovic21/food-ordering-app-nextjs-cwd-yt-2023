# AI Agent Guide

This repository is a full-stack food ordering app built with Next.js App Router, TypeScript, MongoDB (Mongoose), NextAuth, Stripe, Cloudinary, Leaflet, Upstash Redis, Upstash QStash, and Resend/React Email.

## Project Summary

- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Radix, Recharts, TanStack Query, TanStack Table, nuqs, cmdk, and react-error-boundary.
- Backend: Next.js route handlers in app/api with Mongoose models in models/.
- Auth: NextAuth with MongoDB adapter and Google OAuth.
- Payments: Stripe Checkout, payment-link endpoint, and webhook processing.
- Images: Cloudinary uploads for user and menu media.
- Image optimization: `sharp` is installed for Next.js production image optimization.
- Maps: Leaflet and React Leaflet for courier and delivery tracking.
- Email: Resend + React Email (`react-email`, `@react-email/components`, `@react-email/render`) for purchase receipts.
- AI: OpenAI SDK is used server-side for admin menu item description generation.
- Rate limiting: Upstash Redis stores short-lived counters for sensitive auth, checkout, support, and AI routes.
- Background jobs: Upstash QStash schedules delayed order-maintenance checks for stale unpaid orders, unanswered courier assignments, and ready orders that cannot get a courier.
- Sharing: `react-share` is used for social share actions.
- Client data cache: TanStack Query powers shared profile data, favorite IDs/lists, notification/message sound settings, message inbox/thread views, and global message/notification unread state.
- Data tables: TanStack Table powers shared searchable, sortable, paginated table UI through `components/shared/TanStackDataTable.tsx`.
- Dates: `date-fns` and `@date-fns/tz` are used through `libs/dateFormat.ts` for UI, email, and PDF date formatting in the app timezone.
- Money and phone helpers: `currency.js` is wrapped by `libs/money.ts`, and `libphonenumber-js` is wrapped by `libs/phone.ts`.
- Observability: Sentry monitors browser, server, and edge errors/traces through `instrumentation-client.ts`, `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `app/global-error.tsx`; browser Session Replay is production-only and sampled only on errors; Vercel Web Analytics and Speed Insights are mounted from `@vercel/analytics/next` and `@vercel/speed-insights/next` in `app/layout.tsx`.

## High-Level Features

- Customer flows: auth, profile, menu browsing, cart/checkout, best coupon suggestion, reorder, favorite restaurant quick reorder, restaurant availability alerts, favorites, loyalty history, reviews, approved messaging, visual order tracking, order timelines, delivery confirmation, and support tickets.
- Admin dashboard: users, categories, menu items, restaurants, restaurant reports, orders, order queue, late-order alerts, couriers, support tickets, statistics, and AI-assisted menu descriptions.
- Courier flows: assignment with courier-only notes, availability toggle, live location sharing, delivery PIN handoff, problem reporting, tracked delivery maps, and delivery history metrics.
- Restaurant operations: menu item availability, working-hours checkout protection, 60-minute-before-closing checkout cutoff, pause/blocked-date/radius checks, preparation/delivery estimates, and active order limit checks that can temporarily block checkout when the kitchen is busy.

## Local Setup

1. Install dependencies:
   npm install
2. Create `.env` using `example.env` as a template.
3. Run dev server:
   npm run dev

## Environment Variables

See `example.env`. Variables currently used in the project include:

- `NODE_ENV`
- `MONGODB_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_PK`, `STRIPE_SK`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` (UI checks)
- `SUPER_ADMIN_EMAIL` (optional server-side override)
- `RESEND_API_KEY`, `SENDER_EMAIL`, optional `RESEND_RECEIVER_EMAIL`
- `OPEN_AI_API_KEY` (server-side OpenAI key for AI menu descriptions)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional Redis rate limiting)
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` (optional delayed order maintenance jobs)
- `SKIP_VERIFY_EMAIL` (optional credentials-auth verification toggle)
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` (optional Sentry monitoring)
- `SENTRY_AUTH_TOKEN` (optional build-time source map upload token; secret, never expose client-side)

## Code Layout

- app/: Next.js App Router pages, layouts, and route handlers
  - app/api/: API routes
  - app/(home)/: marketing/home components
  - app/(auth)/: login/register
  - app/admin-dashboard/: admin pages
  - app/my-delivery and app/my-deliveries/: courier pages
- components/: shared components and UI primitives
- contexts/: React contexts and hooks
- libs/: auth, integrations, business rules, and helper utilities
- models/: Mongoose schemas
- types/: reusable TypeScript domain models, DTOs, and API response contracts shared across frontend, backend, contexts, and libs
- public/: static assets

## Conventions

- Use TypeScript for new code.
- Keep reusable domain, DTO, and API response types in `types/` using lowercase feature filenames and PascalCase exported type names. Small one-off component prop types can stay colocated with their component.
- Keep components small and focused; prefer composition from shared components.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch. Keep `main` as the stable baseline.
- API route handlers should validate inputs and use models/ for data access.
- Keep secrets in server-side code only (Stripe, Cloudinary, Resend, OpenAI keys).
- Do not hardcode personal addresses, phone numbers, or private receiver emails; use neutral fixtures or env vars such as `RESEND_RECEIVER_EMAIL`.
- Avoid breaking API response shapes unless explicitly requested.
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts` (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm`).
- Use `libs/money.ts` for business money calculations; avoid hand-rolled floating-point arithmetic in checkout, coupons, earnings, and reports.
- Use `libs/phone.ts` before saving customer/admin/courier phone values; local Bosnia and Herzegovina numbers are accepted and normalized to E.164.
- Messaging should remain role-restricted: no customer-to-customer chat, and order threads must match the assigned courier or restaurant owner.
- Checkout must preserve restaurant accepting-order checks: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty must be validated before creating Stripe sessions.
- Checkout should deduplicate recent identical unpaid `placed` attempts using `checkoutFingerprint`; reuse or recover the existing Stripe Checkout session instead of creating duplicate orders.
- System auto-cancellation of stale unpaid orders should attempt to expire the open Stripe Checkout session and record the result in audit metadata without blocking local cancellation.
- Customer manual cancellation of unpaid `placed` orders should use the same Stripe Checkout session expiration helper and audit the result.
- Best coupon suggestions are user-facing help only; checkout must revalidate coupons server-side.
- Reorder must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Restaurant quick reorder must use the same current `menu_items` rebuild rules as order reorder.
- Restaurant report UI lives at `/admin-dashboard/restaurant-reports`; daily, weekly, and monthly reports should show zeros for empty periods and disable PDF download when there is no activity.
- Delivery completion is double-confirmed: courier records handoff with the delivery PIN, then customer or restaurant admin finalizes completion.
- Courier assignment history should record accepted, declined, and expired attempts so courier reliability stats can calculate response rate, acceptance rate, missed assignments, and average response time.
- Stale unpaid `placed` orders can auto-cancel after 30 minutes, pending courier assignments expire after 10 minutes without a courier response, and `ready` orders without a courier can warn after 15 minutes and auto-cancel after 60 minutes.
- Support tickets should remain role-scoped: restaurant owners handle their restaurant reports, while app-support tickets route to the super admin.
- Order notifications can include ETA-style phase copy, late active-order alerts should point admins toward the order queue, and failed-delivery review notifications should point restaurant admins to `/admin-dashboard/orders/[id]`.
- QStash delayed job routes must stay server-only, verify QStash signatures, and reuse existing idempotent business helpers such as `applyOrderAutoCancellation`. Publishing should fail open so checkout/order status updates do not break if QStash is unavailable.
- Realtime updates use SSE with polling fallback: `/api/messages/stream` and `/api/notifications/stream` push events only to the signed-in participant/recipient, and clients should still refresh existing JSON endpoints as the source of truth.
- TanStack Query should be used for client-side server data that benefits from cache, refetch, invalidation, optimistic updates, or polling. Keep query keys in `libs/queryKeys.ts`; use `queryKeys.favorites` for favorite ID/list invalidation and SSE events to invalidate query keys instead of duplicating source-of-truth state.
- TanStack Table should be used through `components/shared/TanStackDataTable.tsx` for larger list UIs that need search, sorting, pagination, or column visibility. Use simple mode without toolbar/pagination for small read-only detail tables such as order items. Keep page-specific mutations and business actions in the owning component, not in the shared table wrapper.
- `NuqsAdapter` is mounted in `app/layout.tsx`; use `nuqs` for URL-backed client state such as filters, sort, search, selected ticket links, periods, and pagination when shareable URLs matter.
- `components/shared/AppCommandPalette.tsx` uses `cmdk`; add new important routes/actions there when adding major navigation surfaces.
- `components/shared/AppErrorBoundary.tsx` uses `react-error-boundary` and reports caught client render errors to Sentry; keep it as client recovery, not API validation.
- Keep Sentry instrumentation files intact. Sentry DSNs are allowed in browser config, but `SENTRY_AUTH_TOKEN` is a build secret used for source maps and must stay out of client code. Keep Session Replay disabled in development so local testing does not consume replay quota.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.

## Documentation Maintenance

- Treat docs updates as part of feature completion, not as optional cleanup after the code works.
- Update documentation in the same branch/PR when a change adds or changes routes, role behavior, environment variables, database fields/models, third-party integrations, background jobs, order/payment/email/courier/auth logic, realtime behavior, observability, test commands, or user-facing workflows.
- Use the smallest useful docs change. Avoid repeating implementation details everywhere; put product behavior in `DESCRIPTION.md`, system/data-flow details in `ARCHITECTURE.md`, setup and package/env guidance in `README.md`, and test workflow changes in `TESTING.md`, `__tests__/README.md`, or `e2e/README.md`.
- Keep AI guidance synchronized across `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/project-instructions.md`, `.gemini/project-instructions.md`, `.cursor/rules/project-conventions.mdc`, and `.windsurf/rules/project-conventions.md` when changing workflow-critical rules.
- Use `.github/pull_request_template.md` as the final merge checklist for validation and documentation ownership.
- Do not add new AI-tool config folders unless the team actually uses that tool. Prefer maintaining the existing small set of AI instruction files.
- In the final response for non-trivial changes, mention whether docs were updated or why no docs change was needed.

## AI Configuration Folders

- `.cursor/rules/project-conventions.mdc` contains Cursor auto-applied rules.
- `.claude/project-instructions.md` contains supplemental Claude workflow guidance.
- `.windsurf/rules/project-conventions.md` contains Windsurf project rules.
- `.gemini/project-instructions.md` contains supplemental Gemini workflow guidance.
- Root files remain canonical for shared project policy: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Keep these files consistent when changing auth, payments, email, courier, env vars, or docs policy.

## Common Commands

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run test
- npm run test:watch
- npm run test:file -- **tests**/api/register.route.test.ts
- npm run test:auth
- npm run test:profile
- npm run test:qstash
- npm run test:e2e
- npm run test:e2e:file -- e2e/auth/register-login.e2e.test.ts
- npm run test:e2e:profile
- npm run test:all
- npm run favorites:backfill
- npm run stripe:listen
- npm run stripe:trigger

## Testing Conventions

- Test runner: Vitest (`vitest.config.ts`).
- Test root folders: `__tests__/`, `mocks/`, and `e2e/`.
- Start with high-risk logic (auth, payments, webhooks, role checks).
- Keep runtime code unchanged unless explicitly requested; prefer tests-only changes.
- For auth tests, cover both success and failure behavior contracts.
- For profile tests, cover info updates, image upload/remove, and account deletion flows.
- For order-flow tests, cover checkout validation, best coupon suggestion, reorder validation, restaurant availability, notification copy, courier summaries, and delivery status transitions.
- For date-format changes, cover `libs/dateFormat.ts` and any business logic that depends on weekday/date calculations.
- Use `__tests__/utils/testFactories.ts` for generated fixtures, and prefer `__tests__/utils/mongoMemoryServer.ts` when a Mongo integration test needs full database isolation.
- Use `MONGODB_URL_TESTS` for local test database configuration when needed.
- Keep e2e tests data-safe with explicit cleanup of created records.

## When Modifying Auth, Payments, Email, or Courier Logic

- Confirm required env vars are present (`NEXTAUTH_*`, `STRIPE_*`, `RESEND_*`, Cloudinary values, optional `UPSTASH_REDIS_*` values, and optional `QSTASH_*` values when delayed jobs are touched).
- Keep Stripe webhook handling idempotent.
- Do not expose server secrets in client bundles.
- Preserve courier location validation and role checks.

## Quality Checklist

- Lint passes: npm run lint
- No secrets in source control
- Update README.md (and, if needed, documentation.txt) when adding major features or env vars
