---
trigger: model_decision
description: Project rules for this Next.js food ordering app. Use when editing TypeScript, API routes, auth, payments, email, courier, and docs.
---

# Food Order App

## Project Conventions

- Stack: Next.js 16 App Router, TypeScript, MongoDB (Mongoose), NextAuth, Stripe, Cloudinary, Leaflet, Resend.
- Keep changes small and incremental.
- Follow existing patterns in app/, libs/, models/, and components/.
- Prefer TypeScript-safe code and avoid implicit any.
- Do not add new dependencies unless explicitly requested.

## Backend And Security Rules

- Never expose server secrets in client code.
- Keep Stripe, Cloudinary, and Resend credentials in server-side code only.
- Validate API inputs and keep response shapes stable unless a change is requested.
- Preserve role checks for admin, courier, and user flows.
- Preserve checkout acceptance checks before Stripe session creation, including working hours, closing-soon cutoff, pause state, blocked dates, delivery radius, kitchen capacity, item availability, coupons, and loyalty.
- Preserve stale unpaid auto-cancel protection: system cancellation should try to expire the open Stripe Checkout session and audit the result without blocking local order cancellation.
- Preserve customer manual cancel protection: unpaid `placed` order cancellation should use the same Stripe Checkout expiration helper and audit metadata.
- Preserve delivery double confirmation with courier PIN handoff followed by customer/admin completion.
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
