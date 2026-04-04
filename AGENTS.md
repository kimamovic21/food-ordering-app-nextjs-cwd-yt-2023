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

- Customer flows: auth, profile, menu browsing, cart/checkout, favorites, loyalty, reviews.
- Admin dashboard: users, categories, menu items, restaurants, orders, couriers, statistics.
- Courier flows: assignment, availability toggle, live location sharing, and tracked delivery maps.

## Local Setup

1) Install dependencies:
   npm install
2) Create `.env` using `example.env` as a template.
3) Run dev server:
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

## Common Commands

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run favorites:backfill
- npm run stripe:listen
- npm run stripe:trigger

## When Modifying Auth, Payments, Email, or Courier Logic

- Confirm required env vars are present (`NEXTAUTH_*`, `STRIPE_*`, `RESEND_*`, Cloudinary values).
- Keep Stripe webhook handling idempotent.
- Do not expose server secrets in client bundles.
- Preserve courier location validation and role checks.

## Quality Checklist

- Lint passes: npm run lint
- No secrets in source control
- Update README.md (and, if needed, documentation.txt) when adding major features or env vars
