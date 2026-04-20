# Gemini Instructions

This file provides project context and coding guidance for Gemini tools.

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

## Goals For AI Assistance

- Prefer small, incremental changes with clear explanations.
- Respect existing patterns in app/, libs/, models/, and components/.
- Use TypeScript types and avoid implicit any.
- Do not introduce new dependencies unless requested.
- Keep docs in sync when adding features, integrations, or env vars.

## Coding Guidelines

- Keep server secrets in server-only code (route handlers, libs).
- Validate API inputs and return clear error responses.
- Use existing utility helpers when possible (libs/).
- Avoid breaking API response shapes.
- Preserve role-based access checks (admin/courier/user).
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

- No automated test suite is defined.
- Run npm run lint after changes.
- For API changes, note any new env vars in example.env.
- For feature additions, also update README.md and AGENTS.md.

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

Optional server-side override used in auth flow:

- SUPER_ADMIN_EMAIL
