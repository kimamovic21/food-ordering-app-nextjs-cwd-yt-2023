# Fullstack Food Ordering App (Next.js)

Production: [https://foacwd.vercel.app/](https://foacwd.vercel.app/)

## Overview

This is a full-stack food ordering platform built with Next.js App Router and TypeScript.

It includes:

- customer authentication, profile management, cart, checkout, and order history
- restaurant browsing with search/filter/sort/pagination and shareable URLs
- favorites for meals and restaurants
- restaurant availability alerts when checkout is blocked by closed, paused, closing-soon, or busy restaurants
- loyalty rewards with delivery fee discounts and loyalty history
- ratings and review flows
- approved in-app messaging between customers, restaurant owners, admins, and couriers
- notifications center with unread counts, mark-as-read actions, and role-aware routing
- SSE-backed live refresh for notifications, order status screens, courier assignment, and admin order queues with polling kept as fallback
- TanStack Query caching for shared profile data, favorites, sound settings, and global message/notification unread state
- TanStack Table-powered searchable, sortable, paginated data tables for high-traffic admin and order lists
- Vercel Web Analytics for production traffic insights
- admin dashboard for users, menu items, categories, restaurants, restaurant reports, couriers, orders, support tickets, and statistics
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
- Sentry error monitoring, tracing, and production-only error-sampled privacy-masked Session Replay

## Key Features

### Customer Features

- Authentication with credentials and Google OAuth
- Profile editing (name, phone, address, avatar)
- Menu and restaurant discovery with filtering/sorting/search
- Menu item availability indicators with disabled ordering for sold-out items
- Cart, checkout, best coupon suggestion, busy/closed restaurant checks, restaurant availability alerts, and order tracking
- Favorites for menu items and restaurants
- Loyalty tiers and automatic delivery-fee discounts
- Personal review management and restaurant review pages
- Per-order courier reviews and ratings (optional, one submission per order)
- Order details with courier information, order timeline estimates, delivery PIN visibility, customer delivery confirmation, and a public courier review page for customers
- Reorder previous orders from order history, order details, restaurant details, or favorite restaurants after current menu item availability and prices are revalidated
- Report-problem action on order details, creating support tickets for restaurant support or app support
- Social sharing actions for restaurant/menu pages
- Message inbox and selected thread view at `/messages`

### Admin and Staff Features

- Role-based access (user, admin, courier)
- Super-admin protected management actions
- CRUD for categories, menu items, restaurants, and users
- Menu item availability controls for temporarily unavailable or sold-out items
- Restaurant preparation/delivery estimate settings, working-hours checkout protection, and active order limit controls
- Courier management and order assignment with optional courier-only assignment notes
- Order lifecycle management, late-order operational alerts, order queue, and dashboards/statistics
- Restaurant reports at `/admin-dashboard/restaurant-reports` with daily, weekly, and monthly summaries plus PDF downloads when there is activity
- Support ticket dashboard for reported order, delivery, and app issues
- Notifications management with SSE-backed order, delivery, and assignment updates
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
- TanStack Query: [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- TanStack Table: [https://tanstack.com/table/latest](https://tanstack.com/table/latest)
- nuqs: [https://nuqs.dev/](https://nuqs.dev/)
- cmdk: [https://cmdk.paco.me/](https://cmdk.paco.me/)
- Lucide React: [https://lucide.dev/](https://lucide.dev/)
- React Icons: [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/)
- Sonner: [https://sonner.emilkowal.ski/](https://sonner.emilkowal.ski/)
- Recharts: [https://recharts.org/](https://recharts.org/)
- Embla Carousel: [https://www.embla-carousel.com/](https://www.embla-carousel.com/)
- dnd-kit: [https://dndkit.com/](https://dndkit.com/)
- next-themes: [https://github.com/pacocoursey/next-themes](https://github.com/pacocoursey/next-themes)
- @react-pdf/renderer: [https://react-pdf.org/](https://react-pdf.org/)
- react-error-boundary: [https://www.npmjs.com/package/react-error-boundary](https://www.npmjs.com/package/react-error-boundary)

### Forms and Validation

- React Hook Form: [https://react-hook-form.com/](https://react-hook-form.com/)
- Zod: [https://zod.dev/](https://zod.dev/)
- Hookform Resolvers: [https://github.com/react-hook-form/resolvers](https://github.com/react-hook-form/resolvers)
- T3 Env: [https://env.t3.gg/](https://env.t3.gg/)
- date-fns: [https://date-fns.org/](https://date-fns.org/)

### Styling Utilities

- class-variance-authority: [https://cva.style/docs](https://cva.style/docs)
- clsx: [https://github.com/lukeed/clsx](https://github.com/lukeed/clsx)
- tailwind-merge: [https://github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge)

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
- sharp: [https://sharp.pixelplumbing.com/](https://sharp.pixelplumbing.com/)
- Leaflet: [https://leafletjs.com/](https://leafletjs.com/)
- React Leaflet: [https://react-leaflet.js.org/](https://react-leaflet.js.org/)

### Email and Sharing (recent additions)

- Resend: [https://resend.com](https://resend.com)
- React Email: [https://react.email/](https://react.email/)
- @react-email/components: [https://react.email/docs/components](https://react.email/docs/components)
- @react-email/render: [https://react.email/docs/utilities/render](https://react.email/docs/utilities/render)
- react-share: [https://www.npmjs.com/package/react-share](https://www.npmjs.com/package/react-share)
- OpenAI SDK: [https://platform.openai.com/docs/libraries](https://platform.openai.com/docs/libraries)

### Observability

- Sentry Next.js SDK: [https://docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Vercel Web Analytics: [https://vercel.com/docs/analytics](https://vercel.com/docs/analytics)

### Testing

- Vitest: [https://vitest.dev/](https://vitest.dev/)
- Testing Library React: [https://testing-library.com/docs/react-testing-library/intro/](https://testing-library.com/docs/react-testing-library/intro/)
- MSW: [https://mswjs.io/](https://mswjs.io/)
- jsdom: [https://github.com/jsdom/jsdom](https://github.com/jsdom/jsdom)

### Sentry Monitoring

- Sentry is configured through `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation.ts`.
- `app/global-error.tsx` captures root App Router render errors.
- `/sentry-example-page` and `/api/sentry-example` are development-only verification helpers.
- Client replay is production-only and error-sampled to protect quota; text and inputs are masked and media is blocked.
- Production source maps require `SENTRY_AUTH_TOKEN` at build time so stack traces point back to original TypeScript/TSX files.

### AI Menu Description Assistant

- Admin menu item create and edit forms include a sparkles action on the description field.
- The action calls `POST /api/ai/menu-item-description` from the server, so the OpenAI key is never exposed to the browser.
- The route uses `gpt-5-mini` and caps generated descriptions at 700 characters.

### Messaging

- Routes: `/messages` is the inbox, and `/messages/[participantId]` opens a specific approved thread.
- Access rules: customers can only chat with their assigned courier or restaurant owner for an order; admins can chat with other admins and couriers; customer-to-customer chat stays blocked.
- Realtime: the implementation uses server-sent events plus polling so unread badges and open threads update quickly without a third-party chat service.
- Security: messages are stored in MongoDB with app-level authorization and transport/session security. End-to-end encryption is intentionally not enabled here because the app needs role-based operational visibility and moderation; if strict E2E is required later, treat it as a separate product decision.

### Realtime Updates

- SSE routes are implemented with browser-native `EventSource`, so no extra npm package or external realtime account is required.
- `/api/messages/stream` pushes message events to the signed-in participant.
- `/api/notifications/stream` pushes notification events only to the signed-in recipient.
- Notifications remain stored in MongoDB as the source of truth; SSE only tells the UI to refresh sooner.
- Global message and notification badges use TanStack Query through `components/shared/TanStackQueryProvider.tsx` and shared keys in `libs/queryKeys.ts`.
- SSE events invalidate the relevant TanStack Query keys, then the existing JSON endpoints return the authoritative data.
- Polling remains in place as a fallback for notifications, messages, order details, courier delivery, and admin order views if an SSE connection drops or a serverless instance cannot share in-memory events.
- Order status, courier assignment, paid-order, canceled-order, late-order, support-ticket, and restaurant-availability notifications can trigger instant UI refreshes on relevant screens.

### TanStack Query

- `components/shared/TanStackQueryProvider.tsx` creates the client-side `QueryClient` used by app-level providers.
- `libs/queryKeys.ts` stores shared query keys so cache invalidation stays consistent.
- Shared profile data, favorite IDs/lists, notification/message sound settings, message inbox/thread views, and global messages/notifications use TanStack Query for server-state caching, background refetch, optimistic updates, and SSE-driven invalidation where applicable.
- Favorite toggle buttons update `queryKeys.favorites` optimistically, then invalidate the same favorite group so menu cards, restaurant cards, and favorite pages stay in sync.
- Existing route handlers remain the source of truth. TanStack Query should not replace API authorization, MongoDB validation, checkout validation, or webhook idempotency.
- Prefer TanStack Query for future client screens with server data that needs loading state, refetching, cache invalidation, polling, or window-focus refresh.

### TanStack Table

- `components/shared/TanStackDataTable.tsx` provides the shared headless table wrapper for searchable, sortable, paginated UI tables.
- `components/shared/OrderItemsDataTable.tsx` provides the simple TanStack-powered order item table used inside order detail cards.
- Current rollout uses TanStack Table on `/admin-dashboard/orders`, `/admin-dashboard/users`, `/admin-dashboard/menu-items`, `/admin-dashboard/audit-logs`, `/my-orders`, `/admin-dashboard/orders/[id]`, and `/my-orders/[id]`.
- Keep order/payment/reorder/cancel handlers in the owning screen component; use the table wrapper only for presentation, filtering, sorting, pagination, and column visibility.
- Prefer TanStack Table for larger admin/customer lists. For small detail tables, use the simple mode without toolbar or pagination when a clean read-only table is better.

### Frontend Utility Packages

- `nuqs` is mounted through `NuqsAdapter` in `app/layout.tsx` and is used for URL-backed search, filters, sorting, period filters, selected ticket links, and pagination on menu, restaurant, reports, orders, users, and support views.
- `cmdk` powers the global app command palette in `components/shared/AppCommandPalette.tsx`. Open it from the header search button or with `Ctrl/Cmd + K`.
- `react-error-boundary` powers `components/shared/AppErrorBoundary.tsx`, which wraps the main app shell and reports caught client render errors to Sentry.
- `sharp` is installed so Next.js image optimization has the recommended production image processor available. It is used automatically by Next.js and should not be imported directly in app components.
- `@vercel/analytics` is mounted in `app/layout.tsx` with `<Analytics />`. It does not need a project env var for normal Vercel deployments and complements Sentry by tracking product traffic instead of application errors.

### Order Flow And Restaurant Capacity

- Restaurants can configure average preparation time, average delivery time, and an active kitchen order limit in the admin restaurant form.
- Checkout snapshots the restaurant estimates onto each order, so order detail timelines can show expected timing alongside actual phase durations.
- Checkout blocks restaurants that are closed, paused, outside delivery radius, blocked by working hours, or inside the final 60 minutes before closing, and surfaces the next opening time when available.
- Checkout blocks new orders when the restaurant has reached its paid active kitchen order limit (`placed`, `processing`, or `ready` orders).
- Checkout deduplicates recent identical unpaid `placed` order attempts by reusing or recovering the existing Stripe Checkout session instead of creating another order.
- Cart can suggest the best public coupon for the current restaurant subtotal and let the customer apply it directly.
- Checkout blocks customers from starting another paid active order until the previous order is completed or canceled.
- Previous orders can be reordered into the cart only after current menu item existence, availability, restaurant ownership, and prices are rechecked.
- Favorite restaurants and restaurant detail pages can rebuild the latest previous order from that restaurant into the cart.
- Customers can request a notification when a closed, paused, closing-soon, or busy restaurant starts accepting orders again.
- Couriers record delivery handoff with a customer-visible PIN; customers or the restaurant admin then finalize delivery completion.
- If a customer is unavailable after extended transport time, the courier can request failed-delivery cancellation; the restaurant owner or super admin must verify it before the order is canceled and the courier is released.
- Order status notifications use phase-specific copy, including preparation and delivery ETA hints when an estimate is available.
- Customers and couriers can report order or delivery problems; admins manage those reports from `/admin-dashboard/support-tickets`.
- Failed-delivery review notifications route restaurant admins to `/admin-dashboard/orders/[id]`, while customer order notifications stay on customer order pages.
- `/admin-dashboard/orders` surfaces late active-order alerts and links to `/admin-dashboard/order-queue` for the full operational view.
- `/admin-dashboard/restaurant-reports` generates daily, weekly, and monthly restaurant performance summaries from order data and can download the same report as a PDF when the selected period has traffic.

## Auth: Email Verification & Password Reset

- Overview: Credentials-based accounts now require email verification when `SKIP_VERIFY_EMAIL` is `false` (recommended for local development). In production you can set `SKIP_VERIFY_EMAIL=true` to skip verification for legacy or migration scenarios.
- Scope: This applies only to `provider: 'credentials'` users. OAuth users (Google) are automatically marked verified and are not subject to verification or password reset flows.
- Env vars used: `RESEND_API_KEY`, `SENDER_EMAIL`, optional `RESEND_RECEIVER_EMAIL`, `SKIP_VERIFY_EMAIL`, and optional Upstash Redis variables for rate limiting.
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
- RESEND_RECEIVER_EMAIL: optional local/test receiver override for purchase receipt emails; when omitted, receipts go to the order customer email
- SKIP_VERIFY_EMAIL: when true, skips email verification for credential sign-ups and legacy accounts
- OPEN_AI_API_KEY: OpenAI API key for server-side AI menu description generation
- UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint for rate limiting
- UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token for rate limiting
- NEXT_PUBLIC_SENTRY_DSN: public Sentry DSN used by browser monitoring
- SENTRY_DSN: Sentry DSN used by server and edge monitoring
- SENTRY_AUTH_TOKEN: build-time Sentry token for source map upload; keep this secret and set it only in local/CI/Vercel env

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
- Sentry: [https://sentry.io/](https://sentry.io/)

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
