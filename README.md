# Fullstack Food Ordering App (Next.js)

Production: [https://foacwd.vercel.app/](https://foacwd.vercel.app/)

## Overview

This is a full-stack food ordering platform built with Next.js App Router and TypeScript.

It includes:

- customer authentication, profile management, cart, checkout, and order history
- restaurant browsing with search/filter/sort/pagination and shareable URLs
- favorites for meals and restaurants
- loyalty rewards with delivery fee discounts and loyalty history
- ratings and review flows
- approved in-app messaging between customers, restaurant owners, admins, and couriers
- notifications center with unread counts, mark-as-read actions, and role-aware routing
- admin dashboard for users, menu items, categories, restaurants, couriers, orders, support tickets, and statistics
- courier dashboard with active delivery, delivery history, earnings, and courier ratings views
- courier workflow with assignment, availability toggle, live location sharing on maps, delivery PIN handoff, failed-delivery review, and delivery history
- order timeline with visual phase icons, preparation/delivery estimates, ETA-style notifications, delivery confirmation, reorder, and report-problem support tickets
- order safety automation for stale unpaid orders and ready orders that cannot get a courier
- restaurant busy checkout protection based on each restaurant's active kitchen order limit
- Stripe checkout/webhook flow
- Cloudinary media uploads
- email purchase receipts with Resend + React Email
- AI-assisted menu item descriptions for admin create/edit flows
- Upstash Redis-backed rate limiting for sensitive auth, checkout, support, and AI endpoints

## Key Features

### Customer Features

- Authentication with credentials and Google OAuth
- Profile editing (name, phone, address, avatar)
- Menu and restaurant discovery with filtering/sorting/search
- Menu item availability indicators with disabled ordering for sold-out items
- Cart, checkout, best coupon suggestion, busy/closed restaurant checks, and order tracking
- Favorites for menu items and restaurants
- Loyalty tiers and automatic delivery-fee discounts
- Personal review management and restaurant review pages
- Per-order courier reviews and ratings (optional, one submission per order)
- Order details with courier information, order timeline estimates, delivery PIN visibility, customer delivery confirmation, and a public courier review page for customers
- Reorder previous orders from order history or order details after current menu item availability and prices are revalidated
- Report-problem action on order details, creating support tickets for restaurant support or app support
- Social sharing actions for restaurant/menu pages
- Message inbox at `/messages` and direct thread view at `/messages/[participantId]`

### Admin and Staff Features

- Role-based access (user, admin, courier)
- Super-admin protected management actions
- CRUD for categories, menu items, restaurants, and users
- Menu item availability controls for temporarily unavailable or sold-out items
- Restaurant preparation/delivery estimate settings, working-hours checkout protection, and active order limit controls
- Courier management and order assignment with optional courier-only assignment notes
- Order lifecycle management, late-order operational alerts, order queue, and dashboards/statistics
- Support ticket dashboard for reported order, delivery, and app issues
- Notifications management with order, delivery, and assignment updates
- Messaging center with delivery/seen states, inline editing, and per-user delete behavior
- Payment link endpoint and Stripe webhook handling

### Courier Features

- Courier dashboard with active delivery, delivery history, and ratings sections
- Availability on/off toggle
- Real-time courier location sharing
- Leaflet map tracking with polling + manual refresh
- Delivery PIN entry to record courier handoff before customer/admin confirmation
- Failed-delivery cancellation request when the customer is unavailable after extended transport time
- Estimated delivery time summaries for active and completed deliveries
- Report-problem action for delivery issues
- Courier-facing review and rating list for completed deliveries
- Customer-facing courier review page from order details

## Project Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): technical architecture, diagrams, data model map, and major workflow diagrams.
- [DESCRIPTION.md](./DESCRIPTION.md): role-by-role feature description and business logic overview.

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
- date-fns: [https://date-fns.org/](https://date-fns.org/)

### Auth and Database

- NextAuth.js: [https://next-auth.js.org/](https://next-auth.js.org/)
- Auth.js MongoDB Adapter: [https://authjs.dev/getting-started/adapters/mongodb](https://authjs.dev/getting-started/adapters/mongodb)
- MongoDB: [https://www.mongodb.com/](https://www.mongodb.com/)
- Mongoose: [https://mongoosejs.com/](https://mongoosejs.com/)
- Upstash Redis: [https://upstash.com/](https://upstash.com/)
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

### Order Flow And Restaurant Capacity

- Restaurants can configure average preparation time, average delivery time, and an active kitchen order limit in the admin restaurant form.
- Checkout snapshots the restaurant estimates onto each order, so order detail timelines can show expected timing alongside actual phase durations.
- Checkout blocks restaurants that are closed, paused, outside delivery radius, blocked by working hours, or inside the final 60 minutes before closing, and surfaces the next opening time when available.
- Checkout blocks new orders when the restaurant has reached its paid active kitchen order limit (`placed`, `processing`, or `ready` orders).
- Cart can suggest the best public coupon for the current restaurant subtotal and let the customer apply it directly.
- Checkout blocks customers from starting another paid active order until the previous order is completed or canceled.
- Previous orders can be reordered into the cart only after current menu item existence, availability, restaurant ownership, and prices are rechecked.
- Couriers record delivery handoff with a customer-visible PIN; customers or the restaurant admin then finalize delivery completion.
- If a customer is unavailable after extended transport time, the courier can request failed-delivery cancellation; the restaurant owner or super admin must verify it before the order is canceled and the courier is released.
- Order status notifications use phase-specific copy, including preparation and delivery ETA hints when an estimate is available.
- Customers and couriers can report order or delivery problems; admins manage those reports from `/admin-dashboard/support-tickets`.
- Failed-delivery review notifications route restaurant admins to `/admin-dashboard/orders/[id]`, while customer order notifications stay on customer order pages.
- `/admin-dashboard/orders` surfaces late active-order alerts and links to `/admin-dashboard/order-queue` for the full operational view.

## Auth: Email Verification & Password Reset

- Overview: Credentials-based accounts now require email verification when `SKIP_VERIFY_EMAIL` is `false` (recommended for local development). In production you can set `SKIP_VERIFY_EMAIL=true` to skip verification for legacy or migration scenarios.
- Scope: This applies only to `provider: 'credentials'` users. OAuth users (Google) are automatically marked verified and are not subject to verification or password reset flows.
- Env vars used: `RESEND_API_KEY`, `SENDER_EMAIL`, `SKIP_VERIFY_EMAIL`, and optional Upstash Redis variables for rate limiting.
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

## Rate Limiting

- Upstash Redis stores short-lived counters for sensitive endpoints.
- Protected flows include credentials login, register, forgot password, resend verification, checkout, support ticket creation, and AI menu description generation.
- Redis is not the main database. MongoDB remains the source of truth for users, orders, restaurants, messages, and tickets.
- If Upstash env vars are missing or Redis is temporarily unavailable, `libs/rateLimit.ts` fails open so local development and critical app flows do not break.

## Date Handling

- MongoDB stores real `Date` values for timestamps such as `createdAt`, `updatedAt`, `completedAt`, and order phase fields.
- API responses should serialize dates as ISO strings instead of preformatted labels.
- UI, receipt email, and PDF receipt date formatting should use `libs/dateFormat.ts`.
- The main app display format is `dd/MM/yyyy`; date-time displays use `dd/MM/yyyy HH:mm`.

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
- UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint for rate limiting
- UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token for rate limiting

Note: some flows also support SUPER_ADMIN_EMAIL on server side, while UI checks NEXT_PUBLIC_SUPER_ADMIN_EMAIL.

## Third-Party Setup

- Google Cloud Console (OAuth): [https://console.cloud.google.com/](https://console.cloud.google.com/)
- MongoDB Atlas: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Cloudinary: [https://cloudinary.com/](https://cloudinary.com/)
- Stripe: [https://stripe.com/](https://stripe.com/)
- Resend: [https://resend.com](https://resend.com)
- React Email docs: [https://react.email/](https://react.email/)
- OpenAI API: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- Upstash Redis: [https://upstash.com/redis](https://upstash.com/redis)

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
