# AI Agent Guide

This repository is a full-stack food ordering app built with Next.js App Router, TypeScript, MongoDB (Mongoose), NextAuth, Stripe, Cloudinary, Leaflet, and Resend/React Email.

## Project Summary

- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Radix, Recharts.
- Backend: Next.js route handlers in app/api with Mongoose models in models/.
- Auth: NextAuth with MongoDB adapter and Google OAuth.
- Payments: Stripe Checkout, payment-link endpoint, and webhook processing.
- Images: Cloudinary uploads for user and menu media.
- Maps: Leaflet and React Leaflet for courier and delivery tracking.
- Email: Resend + React Email (`react-email`, `@react-email/components`, `@react-email/render`) for purchase receipts.
- Sharing: `react-share` is used for social share actions.

## High-Level Features

- Customer flows: auth, profile, menu browsing, cart/checkout, favorites, loyalty, reviews, approved messaging.
- Admin dashboard: users, categories, menu items, restaurants, orders, couriers, statistics.
- Courier flows: assignment, availability toggle, live location sharing, and tracked delivery maps.

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
- `RESEND_API_KEY`, `SENDER_EMAIL`

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
- public/: static assets

## Conventions

- Use TypeScript for new code.
- Keep components small and focused; prefer composition from shared components.
- API route handlers should validate inputs and use models/ for data access.
- Keep secrets in server-side code only (Stripe, Cloudinary, Resend keys).
- Avoid breaking API response shapes unless explicitly requested.
- Messaging should remain role-restricted: no customer-to-customer chat, and order threads must match the assigned courier or restaurant owner.

## AI Configuration Folders

- `.cursor/rules/project-conventions.mdc` contains Cursor auto-applied rules.
- `.claude/project-instructions.md` contains supplemental Claude workflow guidance.
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
- Use `MONGODB_URL_TESTS` for local test database configuration when needed.
- Keep e2e tests data-safe with explicit cleanup of created records.

## When Modifying Auth, Payments, Email, or Courier Logic

- Confirm required env vars are present (`NEXTAUTH_*`, `STRIPE_*`, `RESEND_*`, Cloudinary values).
- Keep Stripe webhook handling idempotent.
- Do not expose server secrets in client bundles.
- Preserve courier location validation and role checks.

## Quality Checklist

- Lint passes: npm run lint
- No secrets in source control
- Update README.md (and, if needed, documentation.txt) when adding major features or env vars
