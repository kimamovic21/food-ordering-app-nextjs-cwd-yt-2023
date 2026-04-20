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
- notifications center with unread counts, mark-as-read actions, and role-aware routing
- admin dashboard for users, menu items, categories, restaurants, couriers, orders, and statistics
- courier dashboard with active delivery, delivery history, and courier ratings views
- courier workflow with assignment, availability toggle, live location sharing on maps, and delivery history
- Stripe checkout/webhook flow
- Cloudinary media uploads
- email purchase receipts with Resend + React Email

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

### Admin and Staff Features

- Role-based access (user, admin, courier)
- Super-admin protected management actions
- CRUD for categories, menu items, restaurants, and users
- Courier management and order assignment
- Order lifecycle management and dashboards/statistics
- Notifications management with order, delivery, and assignment updates
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

Note: some flows also support SUPER_ADMIN_EMAIL on server side, while UI checks NEXT_PUBLIC_SUPER_ADMIN_EMAIL.

## Third-Party Setup

- Google Cloud Console (OAuth): [https://console.cloud.google.com/](https://console.cloud.google.com/)
- MongoDB Atlas: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Cloudinary: [https://cloudinary.com/](https://cloudinary.com/)
- Stripe: [https://stripe.com/](https://stripe.com/)
- Resend: [https://resend.com](https://resend.com)
- React Email docs: [https://react.email/](https://react.email/)

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
