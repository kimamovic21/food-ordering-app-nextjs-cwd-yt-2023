# Testing Strategy (Next.js App)

This project uses Vitest for fast TypeScript tests.

It now has two test layers:

- Unit tests in `__tests__/` (mocked dependencies)
- E2E tests in `e2e/` (real test database)

## Why Start With Register/Login

Auth is a high-value and high-risk area. Testing register and login first gives confidence in:

- input validation
- duplicate-email protection
- password verification behavior
- user role assignment for first-user bootstrap

## Current Test Scope

- Unit-level behavior tests for:
  - `app/api/register/route.ts`
  - `app/api/profile/route.ts`
  - `app/api/profile/delivery-addresses/route.ts`
  - `app/api/my-orders/active/route.ts`
  - `app/api/restaurant/operations/route.ts`
  - `app/api/restaurants/[id]/ordering-status/route.ts`
  - `app/api/upload/users/route.ts`
  - `app/api/checkout/route.ts`
  - `app/api/webhook/route.ts`
  - `libs/stripeCheckoutSession.ts`
  - `app/api/coupons/route.ts`
  - `app/api/my-deliveries/route.ts`
  - credentials `authorize` handler in `libs/authOptions.ts`
  - restaurant availability helpers in `libs/restaurantAvailability.ts`
  - restaurant operations overview summaries in `libs/restaurantOperations.ts`
  - notification copy/routing helpers in `libs/notifications.ts`
  - order delay warning helper behavior in `libs/orderDelay.ts`
  - Upstash Redis rate-limit helper behavior in `libs/rateLimit.ts`
  - shared date-fns formatting helpers in `libs/dateFormat.ts`
  - TanStack Query provider, shared query keys, profile hook cache behavior, sound settings cache/mutation behavior, and message center query rendering
  - restaurant ordering-status prefetch caching for faster first add-to-cart clicks
- E2E tests for:
  - register + login flow
  - profile management flow (info update, image upload/remove, account deletion)
  - checkout & payment flow (order creation, coupon application, payment webhook)

Recent high-priority coverage also checks best coupon suggestion rules, restaurant closed/busy availability helpers, pre-cart ordering status checks, saved delivery address duplicate matching, active customer order lookup, restaurant operations overview summaries, ETA-style notification copy, unpaid payment-expiry countdowns, order delay warnings, courier delivery summaries, delete protection for active restaurant/menu orders, Redis rate-limit helper behavior, Stripe Checkout session expiration for stale unpaid/customer-canceled orders, and app date formatting helpers.

## Folder Layout

- `__tests__/`: all test files by domain
- `mocks/`: reusable mock fixtures and sample payloads
- `e2e/`: real-flow tests against the test database

## Best Practices For This Repository

- Add tests for critical flows first (auth, checkout, webhooks).
- Keep mocks realistic, but minimal.
- Use stable data fixtures from `mocks/` to avoid repetition.
- Test success and failure paths for each route/handler.
- Avoid brittle UI snapshots for server business logic.
- Keep tests deterministic and fast.
- When test commands, fixtures, coverage priorities, or e2e setup change, update this file together with `__tests__/README.md` and `e2e/README.md` as needed.
- For feature work, mention whether tests were added, updated, or intentionally skipped in the final task summary.

## Commands

- `npm run test`: run all tests once
- `npm run test:watch`: run in watch mode
- `npm run test:file -- <path>`: run only one file
- `npm run test:api`: run API route tests
- `npm run test:auth`: run only auth-focused tests
- `npm run test:components`: run component tests
- `npm run test:libs`: run library/helper tests
- `npm run test:models`: run model tests
- `npm run test:profile`: run only profile-focused unit tests
- `npm run test:payment`: run only payment & webhook unit tests, including Stripe Checkout session expiration
- `npm run test:e2e`: run all e2e tests
- `npm run test:e2e:watch`: run e2e tests in watch mode
- `npm run test:e2e:file -- <path>`: run one e2e file
- `npm run test:e2e:admin`: run admin e2e tests
- `npm run test:e2e:auth`: run auth e2e tests
- `npm run test:e2e:courier`: run courier e2e tests
- `npm run test:e2e:favorites`: run favorites e2e tests
- `npm run test:e2e:messages`: run messages e2e tests
- `npm run test:e2e:profile`: run only profile-focused e2e tests
- `npm run test:e2e:checkout`: run only checkout & payment e2e tests
- `npm run test:all`: run unit + e2e tests

Useful focused command after recent order-flow changes:

```bash
npm run test:file -- __tests__/api/coupons.route.test.ts __tests__/api/my-deliveries.route.test.ts __tests__/libs/restaurantAvailability.test.ts __tests__/libs/notifications.test.ts
```

Useful focused command after customer order UX/safety changes:

```bash
npm run test:file -- __tests__/libs/orderDelay.test.ts __tests__/api/delivery-addresses.route.test.ts __tests__/api/my-orders-active.route.test.ts __tests__/api/restaurant-ordering-status.route.test.ts __tests__/api/menu-items.route.test.ts __tests__/api/restaurant.route.test.ts __tests__/api/profile.route.test.ts
```

Useful focused command after restaurant operations and cart/order UX changes:

```bash
npm run test:file -- __tests__/libs/restaurantOperations.test.ts __tests__/api/restaurant-operations.route.test.ts __tests__/libs/queryKeys.test.ts __tests__/libs/deliveryAddresses.test.ts __tests__/libs/paymentExpiry.test.ts __tests__/api/delivery-addresses.route.test.ts
```

Useful focused command after rate-limit changes:

```bash
npm run test:file -- __tests__/libs/rateLimit.test.ts __tests__/auth/credentials-authorize.test.ts __tests__/api/register.route.test.ts __tests__/api/forgot-password.route.test.ts __tests__/api/support-tickets.route.test.ts __tests__/api/checkout.route.test.ts __tests__/api/ai-menu-item-description.route.test.ts
```

Useful focused command after date-format changes:

```bash
npm run test:file -- __tests__/libs/dateFormat.test.ts __tests__/libs/restaurantAvailability.test.ts
```

## Environment Variables

In local development, add this to `.env.local`:

- `MONGODB_URL_TESTS=mongodb://localhost:27017/[your-database-name]`

Test setup will use:

1. `MONGODB_URL` if already set
2. otherwise `MONGODB_URL_TESTS` (required; no fallback)

## E2E Notes

- E2E tests use real MongoDB data and perform cleanup of test-created users.
- Keep e2e coverage focused on high-risk user journeys.
- For order-flow work, prioritize tests around checkout validation, reorder validation, coupon selection, restaurant availability, delivery status changes, support ticket permissions, and courier route summaries.
- Detailed e2e guide: `e2e/README.md`.

### New Auth E2E Coverage

- We added comprehensive e2e coverage for the email verification and password reset flows under `e2e/auth/`:
  - `e2e/auth/register-login.e2e.test.ts` — register + login (now verifies email before allowing credentials login in tests).
  - `e2e/auth/verify-email.e2e.test.ts` — covers registration with verification required, prevent login when unverified, verify flow, resend verification, invalid/expired token cases.
  - `e2e/auth/forgot-password.e2e.test.ts` — covers forgot-password, reset-password, OAuth-excluded behavior, token expiry, confirmation matching, and full flow (register → verify → forgot → reset → login).

Run these tests with:

```bash
npm run test:e2e -- e2e/auth/
```

Notes:

- Ensure `MONGODB_URL_TESTS` is set in `.env.local` before running e2e tests.
- The tests perform direct DB updates in places where tokens are hashed and cannot be retrieved from email in the test environment (this keeps tests stable without relying on third-party email capture).
