# Fullstack Food Ordering App (Next.js)

Production: [https://foacwd.vercel.app/](https://foacwd.vercel.app/)

## Overview

This is a full-stack food ordering platform built with Next.js App Router and TypeScript.

It includes:

- customer authentication, profile management, cart, checkout, and order history
- restaurant browsing with search/filter/sort/pagination and shareable URLs
- favorites for meals and restaurants
- loyalty rewards with delivery fee discounts
- ratings and review flows
- approved in-app messaging between customers, restaurant owners, admins, and couriers
- notifications center with unread counts, mark-as-read actions, and role-aware routing
- admin dashboard for users, menu items, categories, restaurants, couriers, orders, and statistics
- courier dashboard with active delivery, delivery history, and courier ratings views
- courier workflow with assignment, availability toggle, live location sharing on maps, and delivery history
- Stripe checkout/webhook flow
- Cloudinary media uploads
- email purchase receipts with Resend + React Email
- AI-assisted menu item descriptions for admin create/edit flows

## Key Features

### Customer Features

- Authentication with credentials and Google OAuth
- Profile editing (name, phone, address, avatar)
- Menu and restaurant discovery with filtering/sorting/search
- Cart, checkout, and order tracking
- Favorites for menu items and restaurants
- Loyalty tiers and automatic delivery-fee discounts
- Personal review management and restaurant review pages
- Per-order courier reviews and ratings (optional, one submission per order)
- Order details with courier information and a public courier review page for customers
- Social sharing actions for restaurant/menu pages
- Message inbox at `/messages` and direct thread view at `/messages/[participantId]`

### Admin and Staff Features

- Role-based access (user, admin, courier)
- Super-admin protected management actions
- CRUD for categories, menu items, restaurants, and users
- Courier management and order assignment
- Order lifecycle management and dashboards/statistics
- Notifications management with order, delivery, and assignment updates
- Messaging center with delivery/seen states, inline editing, and per-user delete behavior
- Payment link endpoint and Stripe webhook handling

### Courier Features

- Courier dashboard with active delivery, delivery history, and ratings sections
- Availability on/off toggle
- Real-time courier location sharing
- Leaflet map tracking with polling + manual refresh
- Courier-facing review and rating list for completed deliveries
- Customer-facing courier review page from order details

## Packages Used (with Official Websites)

This project uses many dependencies; below are the main packages actively used in app features.

### Core

- Next.js: [https://nextjs.org/](https://nextjs.org/)
- React: [https://react.dev/](https://react.dev/)
- TypeScript: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

### UI and UX

- Tailwind CSS: [https://tailwindcss.com/](https://tailwindcss.com/)
- Radix UI: [https://www.radix-ui.com/](https://www.radix-ui.com/)
- shadcn/ui: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- Lucide React: [https://lucide.dev/](https://lucide.dev/)
- React Icons: [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/)
- Sonner: [https://sonner.emilkowal.ski/](https://sonner.emilkowal.ski/)
- Recharts: [https://recharts.org/](https://recharts.org/)
- Embla Carousel: [https://www.embla-carousel.com/](https://www.embla-carousel.com/)
- dnd-kit: [https://dndkit.com/](https://dndkit.com/)

### Forms and Validation

- React Hook Form: [https://react-hook-form.com/](https://react-hook-form.com/)
- Zod: [https://zod.dev/](https://zod.dev/)
- Hookform Resolvers: [https://github.com/react-hook-form/resolvers](https://github.com/react-hook-form/resolvers)

### Auth and Database

- NextAuth.js: [https://next-auth.js.org/](https://next-auth.js.org/)
- Auth.js MongoDB Adapter: [https://authjs.dev/getting-started/adapters/mongodb](https://authjs.dev/getting-started/adapters/mongodb)
- MongoDB: [https://www.mongodb.com/](https://www.mongodb.com/)
- Mongoose: [https://mongoosejs.com/](https://mongoosejs.com/)
- bcrypt: [https://www.npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt)

### Payments

- Stripe: [https://stripe.com/](https://stripe.com/)
- Stripe React SDK: [https://docs.stripe.com/sdks/stripejs-react](https://docs.stripe.com/sdks/stripejs-react)
- Stripe CLI: [https://docs.stripe.com/stripe-cli](https://docs.stripe.com/stripe-cli)

### Images and Maps

- Cloudinary: [https://cloudinary.com/](https://cloudinary.com/)
- Leaflet: [https://leafletjs.com/](https://leafletjs.com/)
- React Leaflet: [https://react-leaflet.js.org/](https://react-leaflet.js.org/)

### Email and Sharing (recent additions)

- Resend: [https://resend.com](https://resend.com)
- React Email: [https://react.email/](https://react.email/)
- @react-email/components: [https://react.email/docs/components](https://react.email/docs/components)
- @react-email/render: [https://react.email/docs/utilities/render](https://react.email/docs/utilities/render)
- react-share: [https://www.npmjs.com/package/react-share](https://www.npmjs.com/package/react-share)
- OpenAI SDK: [https://platform.openai.com/docs/libraries](https://platform.openai.com/docs/libraries)

### AI Menu Description Assistant

- Admin menu item create and edit forms include a sparkles action on the description field.
- The action calls `POST /api/ai/menu-item-description` from the server, so the OpenAI key is never exposed to the browser.
- The route uses `gpt-5-mini` and caps generated descriptions at 700 characters.

### Messaging

- Routes: `/messages` is the inbox, and `/messages/[participantId]` opens a specific approved thread.
- Access rules: customers can only chat with their assigned courier or restaurant owner for an order; admins can chat with other admins and couriers; customer-to-customer chat stays blocked.
- Realtime: the implementation uses server-sent events plus polling so unread badges and open threads update quickly without a third-party chat service.
- Security: messages are stored in MongoDB with app-level authorization and transport/session security. End-to-end encryption is intentionally not enabled here because the app needs role-based operational visibility and moderation; if strict E2E is required later, treat it as a separate product decision.

## Auth: Email Verification & Password Reset

- Overview: Credentials-based accounts now require email verification when `SKIP_VERIFY_EMAIL` is `false` (recommended for local development). In production you can set `SKIP_VERIFY_EMAIL=true` to skip verification for legacy or migration scenarios.
- Scope: This applies only to `provider: 'credentials'` users. OAuth users (Google) are automatically marked verified and are not subject to verification or password reset flows.
- Env vars used: `RESEND_API_KEY`, `SENDER_EMAIL`, and `SKIP_VERIFY_EMAIL`.
- Endpoints (server):
  - `POST /api/register` — creates a credentials user and (when required) issues a verification token and sends an email.
  - `POST /api/verify-email` — accepts `{ token }` and marks the user verified when token is valid.
  - `POST /api/resend-verification` — issues a new verification token and emails it.
  - `POST /api/forgot-password` — issues a password-reset token for credentials users and emails it.
  - `POST /api/reset-password` — accepts `{ token, newPassword, confirmNewPassword }` to update password when token is valid.
- Public pages (client):
  - `/verify-email` — page to accept token via query and to request resend.
  - `/forgot-password` — form to request password reset email.
  - `/reset-password/[token]` — page to set a new password using the token in the URL.

See `libs/authEmails.tsx` for token generation, hashing, and sending logic (Resend + React Email templates are under `components/resend/`).

For the exact complete dependency list and versions, check package.json.

## Environment Variables

Copy example.env into .env and set all values.

- NODE_ENV: app environment (development/production)
- MONGODB_URL: MongoDB connection URI
- NEXTAUTH_URL: base URL of the app for auth callbacks
- NEXTAUTH_SECRET: NextAuth session/JWT secret
- GOOGLE_CLIENT_ID: Google OAuth client ID
- GOOGLE_CLIENT_SECRET: Google OAuth client secret
- CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
- CLOUDINARY_API_KEY: Cloudinary API key
- CLOUDINARY_API_SECRET: Cloudinary API secret
- NEXT_PUBLIC_APP_URL: public app URL used by client-side flows
- STRIPE_PK: Stripe publishable key (client)
- STRIPE_SK: Stripe secret key (server)
- STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
- NEXT_PUBLIC_SUPER_ADMIN_EMAIL: super admin email used for elevated UI/actions
- RESEND_API_KEY: Resend API key for transactional emails
- SENDER_EMAIL: sender identity for outgoing purchase receipt emails
- SKIP_VERIFY_EMAIL: when true, skips email verification for credential sign-ups and legacy accounts
- OPEN_AI_API_KEY: OpenAI API key for server-side AI menu description generation

Note: some flows also support SUPER_ADMIN_EMAIL on server side, while UI checks NEXT_PUBLIC_SUPER_ADMIN_EMAIL.

## Third-Party Setup

- Google Cloud Console (OAuth): [https://console.cloud.google.com/](https://console.cloud.google.com/)
- MongoDB Atlas: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Cloudinary: [https://cloudinary.com/](https://cloudinary.com/)
- Stripe: [https://stripe.com/](https://stripe.com/)
- Resend: [https://resend.com](https://resend.com)
- React Email docs: [https://react.email/](https://react.email/)
- OpenAI API: [https://platform.openai.com/docs](https://platform.openai.com/docs)

## Available Scripts

```bash
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Run production server
npm run lint               # Run ESLint
npm run commitlint         # Lint commit message
npm run favorites:backfill # Backfill favorites fields in database
npm run stripe:listen      # Start Stripe webhook forwarding
npm run stripe:trigger     # Trigger Stripe test event
```

## Local Development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
