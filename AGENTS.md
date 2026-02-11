# AI Agent Guide

This repository is a full-stack food ordering app built with Next.js App Router, TypeScript, MongoDB (Mongoose), NextAuth, Stripe, Cloudinary, and Leaflet.

## Project Summary

- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Radix, Recharts.
- Backend: Next.js route handlers in app/api with Mongoose models in models/.
- Auth: NextAuth with MongoDB adapter.
- Payments: Stripe (webhooks and client SDK).
- Images: Cloudinary uploads.
- Maps: Leaflet and React Leaflet.

## Local Setup

1) Install dependencies:
   npm install
2) Create .env using example.env as a template.
3) Run dev server:
   npm run dev

## Environment Variables

See example.env. Required values include:

- MONGODB_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- `CLOUDINARY_*` and `STRIPE_*` variables

## Code Layout

- app/: Next.js App Router pages, layouts, and route handlers
  - app/api/: API routes
  - app/(home)/: marketing/home components
  - app/(auth)/: login/register
- components/: shared components and ui primitives
- contexts/: React contexts and hooks
- libs/: auth and service helpers
- models/: Mongoose schemas
- public/: static assets

## Conventions

- Use TypeScript for new code.
- Keep components small and focused; prefer composing from shared components.
- API route handlers should validate inputs and use models/ for data access.
- Use server-side logic for secrets (Stripe, Cloudinary) and never expose server keys.

## Common Commands

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run stripe:listen
- npm run stripe:trigger

## When Modifying Auth or Payments

- Confirm `NEXTAUTH_*` and `STRIPE_*` env vars are set.
- Keep Stripe webhook handler idempotent.
- Avoid storing sensitive secrets in the client bundle.

## Quality Checklist

- Lint passes: npm run lint
- No secrets in source control
- Update documentation.txt or README.md when new features are added
