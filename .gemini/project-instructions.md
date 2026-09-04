# Project Instructions For Gemini Workflows

## Stack Profile

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui components
- MongoDB via Mongoose (`models/`)
- NextAuth auth flows (`libs/authOptions.ts`, `app/api/auth/**`)
- TanStack Query client data cache for cache/refetch/invalidation flows
- TanStack Table data-table UX through `components/shared/TanStackDataTable.tsx`
- nuqs URL state for shareable filters/search/sort/pagination
- cmdk for command palette and searchable action-menu patterns
- react-error-boundary for localized client component fallbacks
- Vercel Web Analytics for production traffic insights and Vercel Speed Insights for real-user performance metrics
- Stripe payments (`app/api/checkout/**`, `app/api/payment-link/**`, `app/api/webhook/**`)
- Resend email integration (`libs/sendPurchaseReceiptEmail.tsx`)
- Upstash Redis rate limiting (`libs/rateLimit.ts`)
- Upstash QStash delayed order-maintenance jobs (`libs/qstash.ts`, `app/api/qstash/**`), including unanswered courier assignment timeouts
- Courier assignment history tracks accepted, declined, and expired attempts for reliability stats.
- date-fns and @date-fns/tz date formatting (`libs/dateFormat.ts`)
- currency.js money helpers (`libs/money.ts`) and libphonenumber-js phone helpers (`libs/phone.ts`)
- Order operations: best coupon suggestion, reorder validation, restaurant accepting-order checks, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin completion, support tickets, and late-order alerts

## Coding Expectations

- Use incremental commits and low-risk changes.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch.
- Respect existing code organization and naming patterns.
- Reuse business logic from `libs/` and existing contexts.
- Keep reusable domain, DTO, and API response types in `types/`; use lowercase feature filenames and PascalCase exported names. Keep one-off component props colocated with the component.
- Use TanStack Query for client-side server state that benefits from cache, refetch, invalidation, optimistic updates, or polling. Keep message inbox/thread views, favorite ID/list views, and shared keys in `libs/queryKeys.ts`.
- Use TanStack Table for larger list UIs that need search, sorting, pagination, or column visibility. Use simple mode without toolbar/pagination for small read-only detail tables such as order items. Keep mutations and row actions in the owning screen component.
- `NuqsAdapter` is mounted in `app/layout.tsx`; use `nuqs` for URL-backed filters, sorting, search, selected ticket links, report periods, and pagination when the state should survive refresh/share.
- `components/shared/AppCommandPalette.tsx` uses `cmdk`; add important new routes/actions there when adding major navigation surfaces.
- `components/shared/AppErrorBoundary.tsx` uses `react-error-boundary` and reports caught client render errors to Sentry; keep it for client recovery, not API validation.
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts`.
- Use `libs/money.ts` for business money calculations and `libs/phone.ts` before saving phone numbers.
- Keep strong typing and avoid implicit any.

## Risk Controls

- Never leak server secrets into client bundles.
- Keep role checks intact for admin, courier, and user routes.
- Keep checkout accepting-order checks in place before Stripe sessions are created: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Preserve checkout duplicate protection: recent identical unpaid `placed` attempts use `checkoutFingerprint` and should reuse or recover the existing Stripe Checkout session.
- Preserve stale unpaid auto-cancel protection: system cancellation should try to expire the open Stripe Checkout session and audit the result without blocking local order cancellation.
- Preserve customer manual cancel protection: unpaid `placed` order cancellation should use the same Stripe Checkout expiration helper and audit metadata.
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
- Keep webhook logic idempotent and safe on retries.
- Ask before schema-level changes or backfills that may impact production data.

## Validation Workflow

- Execute `npm run lint` for meaningful code edits.
- Execute `npm run test` for auth and API behavior changes.
- Execute `npm run test:qstash` when changing delayed order-maintenance scheduling, courier assignment timeout logic, or the QStash receiver route.
- Update `example.env` if any env contract changes.
- Update top-level docs when adding major features or integrations.

## Documentation Done Criteria

- For non-trivial changes, decide whether docs need an update before finalizing the task.
- Update `README.md` for setup, package, env var, route, or high-level feature changes.
- Update `DESCRIPTION.md` for user/admin/courier behavior, business rules, support, messaging, checkout, order, restaurant, review, loyalty, or reporting changes.
- Update `ARCHITECTURE.md` for system design, model, integration, background job, realtime, data-flow, or lifecycle changes.
- Update `TESTING.md`, `__tests__/README.md`, or `e2e/README.md` when commands, coverage strategy, fixtures, or test layers change.
- Keep `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/project-instructions.md`, `.gemini/project-instructions.md`, `.cursor/rules/project-conventions.mdc`, and `.windsurf/rules/project-conventions.md` aligned when workflow-critical guidance changes.
- Use `.github/pull_request_template.md` as the final merge checklist for validation and docs ownership.
- Do not create config folders for AI tools that are not actively used in this repository.
- Mention docs updates, or explain why none were needed, in the final response.

## Test Workflow

- Test runner: Vitest.
- Test folders: `__tests__/` for unit tests, `mocks/` for fixtures, `e2e/` for real-flow tests.
- Single-file execution: `npm run test:file -- <path>`.
- Use `__tests__/utils/testFactories.ts` for generated fixtures and `__tests__/utils/mongoMemoryServer.ts` for isolated Mongo integration tests when needed.
- Prefer behavior-focused tests that cover success and failure paths.
- For order-flow work, cover checkout validation, coupon suggestion, restaurant availability, notification copy, courier summaries, and lifecycle transitions.
- Use `npm run test:e2e` for register/login and other real DB flow validation.
