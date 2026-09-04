# Gemini Instructions

This file provides project context and coding guidance for Gemini tools.

## Project Context

- Framework: Next.js 16 App Router (TypeScript)
- UI: Tailwind CSS 4, shadcn/ui, Radix, cmdk, TanStack Table
- Client data cache: TanStack Query
- Auth: NextAuth with MongoDB adapter
- DB: MongoDB via Mongoose
- Payments: Stripe
- Images: Cloudinary
- Image optimization: sharp for Next.js production image handling
- Maps: Leaflet
- Email: Resend + React Email
- AI: OpenAI SDK for server-side menu description generation
- Rate limiting: Upstash Redis for short-lived counters on sensitive routes
- Background jobs: Upstash QStash for delayed order-maintenance checks, including unanswered courier assignment timeouts
- Courier assignment history tracks accepted, declined, and expired attempts for response-rate and missed-assignment stats.
- Dates: date-fns and @date-fns/tz through `libs/dateFormat.ts` for UI, email, and PDF date formatting in the app timezone
- Money and phone helpers: currency.js through `libs/money.ts`, and libphonenumber-js through `libs/phone.ts`
- Sharing: react-share
- URL state: nuqs for shareable search/filter/sort/pagination state
- Client recovery: react-error-boundary for localized interactive fallbacks
- Analytics: Vercel Web Analytics and Vercel Speed Insights mounted in the root layout
- Messaging: approved app-native threads with SSE-backed unread badges and per-user visibility
- Order operations: best coupon suggestion, reorder validation, favorite restaurant quick reorder, restaurant accepting-order checks, restaurant availability alerts, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin delivery confirmation, support tickets, and late-order alerts

## Goals For AI Assistance

- Prefer small, incremental changes with clear explanations.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch.
- Respect existing patterns in app/, libs/, models/, and components/.
- Use TypeScript types and avoid implicit any.
- Keep reusable domain, DTO, and API response types in `types/`; use lowercase feature filenames and PascalCase exported names. Keep one-off component props colocated with the component.
- Do not introduce new dependencies unless requested.
- Keep docs in sync when adding features, integrations, or env vars.

## Coding Guidelines

- Keep server secrets in server-only code (route handlers, libs), including OpenAI keys.
- Validate API inputs and return clear error responses.
- Use existing utility helpers when possible (libs/).
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts` (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm`).
- Use `libs/money.ts` for business money calculations; avoid hand-rolled floating-point arithmetic in checkout, coupons, earnings, and reports.
- Use `libs/phone.ts` before saving phone values; local Bosnia and Herzegovina numbers are accepted and normalized to E.164.
- Avoid breaking API response shapes.
- Preserve role-based access checks (admin/courier/user).
- Preserve messaging restrictions: no customer-to-customer chat, and order conversations must match the assigned courier or restaurant owner.
- Preserve checkout accepting-order checks before Stripe session creation: working hours, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Preserve checkout duplicate protection: recent identical unpaid `placed` attempts use `checkoutFingerprint` and should reuse or recover the existing Stripe Checkout session.
- Preserve stale unpaid auto-cancel protection: when the app cancels an unpaid `placed` order, it should try to expire the open Stripe Checkout session and audit the result without blocking cancellation.
- Preserve customer manual cancel protection: unpaid `placed` order cancellation should use the same Stripe Checkout expiration helper and audit metadata.
- Treat best coupon suggestions as UI help only; checkout must revalidate coupons server-side.
- Reorder flows must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Restaurant reports live at `/admin-dashboard/restaurant-reports` and generate daily, weekly, and monthly summaries/PDFs from order data.
- Preserve delivery double confirmation: courier PIN handoff first, then customer or restaurant admin completion.
- Keep support tickets role-scoped between restaurant support and app support.
- Keep ETA-style notifications and late active-order alerts aligned with order timeline state; failed-delivery review notifications should route restaurant admins to `/admin-dashboard/orders/[id]`.
- Keep QStash delayed job handlers server-only, signature-verified, idempotent, and fail-open around user-facing checkout/order status flows.
- Keep SSE realtime updates lightweight: `/api/messages/stream` and `/api/notifications/stream` should only signal relevant signed-in users, while polling fallback and existing JSON endpoints remain the source of truth.
- Use TanStack Query for client-side server state that needs cache, refetch, invalidation, optimistic updates, or polling. Message inbox/thread views and favorite ID/list views should stay cached through shared keys in `libs/queryKeys.ts`, and SSE should invalidate cached queries instead of duplicating source-of-truth state.
- Use TanStack Table through `components/shared/TanStackDataTable.tsx` for larger list UIs that need search, sorting, pagination, or column visibility. Use simple mode without toolbar/pagination for small read-only detail tables such as order items. Keep row actions and mutations in the owning screen component.
- `NuqsAdapter` is mounted in `app/layout.tsx`; use `nuqs` for URL-backed filters, sorting, pagination, selected ticket links, periods, and other shareable client state.
- `components/shared/AppCommandPalette.tsx` uses `cmdk`; add important new routes/actions there when adding major navigation surfaces.
- `components/shared/AppErrorBoundary.tsx` uses `react-error-boundary` and reports caught client render errors to Sentry; keep it for client-side recovery, not API validation.
- Keep Sentry Session Replay disabled in development; browser replay should stay production-only and sampled on error sessions to protect quota.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
- Preserve QStash scheduling for unpaid-order, courier-assignment-timeout, and ready-without-courier maintenance checks when changing checkout, courier assignment, or order status logic.
- Keep payment and webhook flows idempotent.
- Keep receipt email generation in server code.

## Files Of Interest

- app/api: all API routes
- models: database schemas
- libs/authOptions.ts: NextAuth config
- libs/mongoConnect.ts: DB connection
- libs/cloudinary.ts: Cloudinary client
- libs/sendPurchaseReceiptEmail.tsx: Resend + React Email integration
- components/resend/PurchaseReceiptEmail.tsx: email template
- components/shared/ShareActions.tsx: social sharing actions

## Testing And Validation

- Test runner: Vitest.
- Tests are stored in `__tests__/`.
- Reusable fixtures are stored in `mocks/`.
- E2E tests are stored in `e2e/` and use `MONGODB_URL_TESTS`.
- Initial coverage includes register and credentials login behavior.
- Order-flow coverage includes checkout, coupons, restaurant availability helpers, notification copy, courier delivery summaries, and high-risk lifecycle transitions.
- Use `__tests__/utils/testFactories.ts` for generated fixtures, and `__tests__/utils/mongoMemoryServer.ts` for isolated Mongo integration tests when needed.
- Run npm run lint after changes.
- Run npm run test after test-related changes.
- For API changes, note any new env vars in example.env.
- For feature additions, also update README.md and AGENTS.md.

## Test Commands

- `npm run test`
- `npm run test:watch`
- `npm run test:file -- __tests__/api/register.route.test.ts`
- `npm run test:api`
- `npm run test:auth`
- `npm run test:components`
- `npm run test:libs`
- `npm run test:models`
- `npm run test:profile`
- `npm run test:qstash`
- `npm run test:e2e`
- `npm run test:e2e:file -- e2e/auth/register-login.e2e.test.ts`
- `npm run test:e2e:admin`
- `npm run test:e2e:auth`
- `npm run test:e2e:checkout`
- `npm run test:e2e:courier`
- `npm run test:e2e:favorites`
- `npm run test:e2e:messages`
- `npm run test:e2e:profile`
- `npm run test:all`

## Communication

- Summarize changes and list any manual steps needed.
- Ask before making schema or database migration changes.

## AI Config Folder Strategy

- `GEMINI.md` is the canonical Gemini policy file for this repository.
- `.gemini/project-instructions.md` is a supplemental, task-oriented checklist.
- `.cursor/rules/project-conventions.mdc` and `.claude/project-instructions.md` should stay aligned on security and workflow-critical rules.
- If you update auth, payments, webhook behavior, email flow, env vars, or docs process, keep all root AI docs synchronized.

## Environment Variables Snapshot

Keep these in sync with example.env and code usage:

- NODE_ENV
- MONGODB_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- NEXT_PUBLIC_APP_URL
- STRIPE_PK
- STRIPE_SK
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_SUPER_ADMIN_EMAIL
- RESEND_API_KEY
- SENDER_EMAIL
- RESEND_RECEIVER_EMAIL
- SKIP_VERIFY_EMAIL
- OPEN_AI_API_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- QSTASH_URL
- QSTASH_TOKEN
- QSTASH_CURRENT_SIGNING_KEY
- QSTASH_NEXT_SIGNING_KEY
- NEXT_PUBLIC_SENTRY_DSN
- SENTRY_DSN
- SENTRY_AUTH_TOKEN

Optional server-side override used in auth flow:

- SUPER_ADMIN_EMAIL
