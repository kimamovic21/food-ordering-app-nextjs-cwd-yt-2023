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

## Goals for AI Assistance

- Prefer small, incremental changes with clear explanations.
- Respect existing patterns in app/, libs/, models/, and components/.
- Use TypeScript types and avoid any implicit any.
- Do not introduce new dependencies unless requested.

## Coding Guidelines

- Keep server secrets in server-only code (route handlers, libs).
- Validate API inputs and return clear error responses.
- Use existing utility helpers when possible (libs/).
- Avoid breaking changes to API response shapes.

## Files of Interest

- app/api: all API routes
- models: database schemas
- libs/authOptions.ts: NextAuth config
- libs/mongoConnect.ts: DB connection
- libs/cloudinary.ts: Cloudinary client

## Testing and Validation

- No automated test suite is defined.
- Run npm run lint after changes.
- For API changes, note any new env vars in example.env.

## Communication

- Summarize changes and list any manual steps needed.
- Ask before making schema or database migration changes.
