---
trigger: model_decision
description: Project rules for this Next.js food ordering app. Use when editing TypeScript, API routes, auth, payments, email, courier, and docs.
---

# Food Order App

## Project Conventions

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, MongoDB (Mongoose), NextAuth, Stripe, Cloudinary, Leaflet, Resend, Upstash Redis, Upstash QStash, TanStack Query, TanStack Table, nuqs, cmdk, Sentry, and Vercel Analytics/Speed Insights.
- Keep changes small and incremental.
- Before implementing a new feature or non-trivial app logic, create or switch to a dedicated local feature branch from `main` unless the user explicitly asks to work on the current branch.
- Follow existing patterns in app/, libs/, models/, components/, contexts/, and types/.
- Prefer TypeScript-safe code and avoid implicit any.
- Do not add new dependencies unless explicitly requested.
- Keep reusable domain, DTO, and API response types in `types/`.

## Backend And Security Rules

- Never expose server secrets in client code.
- Keep Stripe, Cloudinary, and Resend credentials in server-side code only.
- Validate API inputs and keep response shapes stable unless a change is requested.
- Preserve role checks for admin, courier, and user flows.
- Saved customer delivery addresses live on `User.deliveryAddresses`, are capped at five, require complete delivery fields plus confirmed latitude/longitude, and should be loaded/mutated through `/api/profile/delivery-addresses`.
- Preserve checkout checks before Stripe session creation: working hours, 60-minute closing-soon cutoff, pause state, blocked dates, delivery radius, active kitchen capacity, item availability, coupons, loyalty, and duplicate unpaid checkout recovery.
- Public add-to-cart surfaces should prefetch visible restaurant ordering status where possible, check `/api/restaurants/[id]/ordering-status` before changing the cart, and still keep checkout as the server-authoritative source of truth.
- Active customer order quick access should use `/api/my-orders/active`, apply stale-order maintenance before returning data, and stay customer-only.
- Order delay warnings should use `libs/orderDelay.ts` and compare elapsed active time against the saved estimated total plus the grace window; development time offsets can affect the warning without changing MongoDB timestamps.
- Do not delete restaurants, restaurant-owner accounts, or menu items while active orders still depend on them; use `libs/orderDeletionGuards.ts` and return `409` with clear guidance.
- Preserve stale unpaid auto-cancel protection: system cancellation should try to expire the open Stripe Checkout session and audit the result without blocking local order cancellation.
- Preserve customer manual cancel protection: unpaid `placed` order cancellation should use the same Stripe Checkout expiration helper and audit metadata.
- Preserve delivery double confirmation with courier PIN handoff followed by customer/admin completion.
- Preserve courier assignment timeout and history logic for accepted, declined, and expired attempts.
- Preserve QStash delayed order-maintenance scheduling and signature verification.
- Preserve Upstash Redis rate limits on sensitive auth, checkout, support, and AI routes.
- Keep support tickets scoped between restaurant support and app support.
- Keep Stripe webhook handling idempotent.
- Preserve QStash delayed order-maintenance checks for unpaid orders, courier assignment timeouts, and ready orders without a courier.

## Code Areas To Treat Carefully

- Auth: libs/authOptions.ts and app/api/auth
- Payments: app/api/checkout, app/api/payment-link, app/api/webhook
- Email: libs/sendPurchaseReceiptEmail.tsx and components/resend
- Courier: app/my-delivery, app/my-deliveries, app/api/my-delivery, app/api/my-deliveries
- Order operations: app/api/orders, app/api/support-tickets, components/shared/OrderPhaseTimeline.tsx

## Validation And Documentation

- Run lint after meaningful edits: npm run lint
- If env usage changes, update example.env.
- For major feature additions, update README.md and AGENTS.md.
- Treat docs updates as part of feature completion. Update DESCRIPTION.md for role/business-rule changes, ARCHITECTURE.md for system/data-flow/model/integration changes, and TESTING.md, **tests**/README.md, or e2e/README.md for test workflow changes.
- Keep AGENTS.md, CLAUDE.md, GEMINI.md, .claude/project-instructions.md, .gemini/project-instructions.md, .cursor/rules/project-conventions.mdc, and .windsurf/rules/project-conventions.md aligned when workflow-critical guidance changes.
- Use .github/pull_request_template.md as the final merge checklist for validation and docs ownership.
- Do not add new AI-tool config folders unless that tool is actively used in this repository.
- Final summaries for meaningful changes should mention whether docs were updated or why no docs update was needed.
