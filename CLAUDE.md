# Claude Instructions

This file provides guidance for AI assistance in this repository.

## Project Context

- Framework: Next.js 16 App Router (TypeScript)
- UI: Tailwind CSS 4, shadcn/ui, Radix
- Auth: NextAuth with MongoDB adapter
- DB: MongoDB via Mongoose
- Payments: Stripe
- Images: Cloudinary
- Maps: Leaflet
- Email: Resend + React Email
- AI: OpenAI SDK for server-side menu description generation
- Rate limiting: Upstash Redis for short-lived counters on sensitive routes
- Dates: date-fns through `libs/dateFormat.ts` for UI, email, and PDF date formatting
- Sharing: react-share
- Messaging: approved app-native threads with realtime unread badges and per-user message visibility
- Order operations: best coupon suggestion, reorder validation, restaurant accepting-order checks, preparation/delivery estimates, delivery PIN handoff, ETA-style notifications, customer/admin delivery confirmation, support tickets, and late-order alerts

## Goals for AI Assistance

- Prefer small, incremental changes with clear explanations.
- Respect existing patterns in app/, libs/, models/, and components/.
- Use TypeScript types and avoid any implicit any.
- Do not introduce new dependencies unless requested.
- Keep docs in sync when adding features, integrations, or env vars.

## Coding Guidelines

- Keep server secrets in server-only code (route handlers, libs), including OpenAI keys.
- Validate API inputs and return clear error responses.
- Use existing utility helpers when possible (libs/).
- Store timestamps as MongoDB `Date` values, return ISO/raw date fields from APIs, and format user-facing dates through `libs/dateFormat.ts` (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm`).
- Avoid breaking changes to API response shapes.
- Preserve role-based access checks (admin/courier/user).
- Preserve message access rules: no customer-to-customer chat, and order conversations must match the assigned courier or restaurant owner.
- Preserve checkout accepting-order checks before Stripe session creation: working hours, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, and loyalty.
- Treat best coupon suggestions as UI help only; checkout must revalidate coupons server-side.
- Reorder flows must rebuild from current `menu_items` data and block deleted, unavailable, cross-restaurant, or invalid items.
- Preserve delivery double confirmation: courier PIN handoff first, then customer or restaurant admin completion.
- Keep support tickets role-scoped between restaurant support and app support.
- Keep ETA-style notifications and late active-order alerts aligned with order timeline state.
- Preserve Upstash Redis rate limits on credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
- Keep payment and webhook flows idempotent.
- Keep receipt email generation in server code.

## Files of Interest

- app/api: all API routes
- models: database schemas
- libs/authOptions.ts: NextAuth config
- libs/mongoConnect.ts: DB connection
- libs/cloudinary.ts: Cloudinary client
- libs/sendPurchaseReceiptEmail.tsx: Resend + React Email integration
- components/resend/PurchaseReceiptEmail.tsx: email template
- components/shared/ShareActions.tsx: social sharing actions

## Testing and Validation

- Test runner: Vitest.
- Tests are stored in `__tests__/`.
- Reusable fixtures are stored in `mocks/`.
- E2E tests are stored in `e2e/` and use `MONGODB_URL_TESTS`.
- Auth starter tests exist for register and credentials login behavior.
- Order-flow coverage includes checkout, coupons, restaurant availability helpers, notification copy, courier delivery summaries, and high-risk lifecycle transitions.
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

- `CLAUDE.md` is the canonical Claude policy file for this repository.
- `.claude/project-instructions.md` is a supplemental, task-oriented checklist.
- `.cursor/rules/project-conventions.mdc` and `.gemini/project-instructions.md` should stay aligned on security and workflow-critical rules.
- If you update auth, payments, webhook behavior, email flow, env vars, or docs process, keep all root AI docs synchronized.

## Environment Variables Snapshot

Keep these in sync with example.env and usage in code:

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
- SKIP_VERIFY_EMAIL
- OPEN_AI_API_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Optional server-side override used in auth flow:

- SUPER_ADMIN_EMAIL
