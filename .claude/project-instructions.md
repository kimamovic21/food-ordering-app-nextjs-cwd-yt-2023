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
- Background jobs: Upstash QStash for delayed order-maintenance checks, including unanswered courier assignment timeouts
- Courier assignment history tracks accepted, declined, and expired attempts for reliability stats.
- Date formatting: date-fns and @date-fns/tz through `libs/dateFormat.ts`
- Money and phone helpers: currency.js through `libs/money.ts`, and libphonenumber-js through `libs/phone.ts`
- Order operations: saved delivery addresses, pre-cart restaurant ordering checks, active order quick access, best coupon suggestion, reorder validation, restaurant accepting-order checks, operations overview, preparation/delivery estimates, order delay warnings, delivery PIN handoff, ETA-style notifications, customer/admin completion, support tickets, and late-order alerts

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
- Saved customer delivery addresses live on `User.deliveryAddresses`, are capped at five, require complete delivery fields plus confirmed latitude/longitude, dedupe duplicate saves by normalized address/phone/coordinates, and should be loaded/mutated through `/api/profile/delivery-addresses`.
- Avoid `any`; prefer explicit typing and narrow unions.

## Safety Rules

- Secrets must remain server-side.
- Treat auth, payments, and courier flows as sensitive paths.
- Keep checkout accepting-order checks in place before Stripe sessions are created: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Public add-to-cart surfaces should prefetch visible restaurant ordering status where possible, check `/api/restaurants/[id]/ordering-status` before changing the cart, and still keep checkout as the server-authoritative source of truth.
- Preserve checkout duplicate protection: recent identical unpaid `placed` attempts use `checkoutFingerprint` and should reuse or recover the existing Stripe Checkout session.
- Cart validation should keep unavailable/deleted/invalid items as hard checkout blockers, while price changes stay non-blocking and should be shown clearly before checkout.
- Active customer order quick access should use `/api/my-orders/active`, apply stale-order maintenance before returning data, and stay customer-only.
- Restaurant operations overview should use `/api/restaurant/operations` and `/admin-dashboard/operations` for active stage counts, kitchen capacity, restaurant status, courier availability, today revenue, unpaid/canceled counts, quick actions, and urgent order attention items.
- Order delay warnings should use `libs/orderDelay.ts` and compare elapsed active time against the saved estimated total plus the grace window; development time offsets can affect the warning without changing MongoDB timestamps.
- Do not delete restaurants, restaurant-owner accounts, or menu items while active orders still depend on them; use `libs/orderDeletionGuards.ts` and return `409` with clear guidance.
- Preserve stale unpaid auto-cancel protection: system cancellation should try to expire the open Stripe Checkout session and audit the result without blocking local order cancellation; customer order screens should show the same 30-minute payment-expiry window.
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
- Keep webhook and async job processing idempotent.
- Never perform destructive DB changes without explicit approval.

## Required Validation

- Run `npm run lint` after non-trivial changes.
- Run `npm run test` when changing auth or API business logic.
- Run `npm run test:qstash` when changing delayed order-maintenance scheduling, courier assignment timeout logic, or the QStash receiver route.
- If environment variables change, update `example.env`.
- If adding major functionality, update docs in `README.md` and AI guidance files.

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
- Use `npm run test:file -- <path>` to run one file during iteration.
- Use `__tests__/utils/testFactories.ts` for generated fixtures and `__tests__/utils/mongoMemoryServer.ts` for isolated Mongo integration tests when needed.
- Keep tests deterministic and focused on route/auth behavior contracts.
- For order-flow work, cover checkout validation, coupon suggestion, restaurant availability, notification copy, courier summaries, and lifecycle transitions.
- Use `npm run test:e2e` for database-backed flows and keep cleanup in test code.
