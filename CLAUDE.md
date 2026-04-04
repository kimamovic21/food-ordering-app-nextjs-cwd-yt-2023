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
- Sharing: react-share

## Goals for AI Assistance

- Prefer small, incremental changes with clear explanations.
- Respect existing patterns in app/, libs/, models/, and components/.
- Use TypeScript types and avoid any implicit any.
- Do not introduce new dependencies unless requested.
- Keep docs in sync when adding features, integrations, or env vars.

## Coding Guidelines

- Keep server secrets in server-only code (route handlers, libs).
- Validate API inputs and return clear error responses.
- Use existing utility helpers when possible (libs/).
- Avoid breaking changes to API response shapes.
- Preserve role-based access checks (admin/courier/user).
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

- No automated test suite is defined.
- Run npm run lint after changes.
- For API changes, note any new env vars in example.env.
- For feature additions, also update README.md and AGENTS.md.

## Communication

- Summarize changes and list any manual steps needed.
- Ask before making schema or database migration changes.

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

Optional server-side override used in auth flow:

- SUPER_ADMIN_EMAIL
