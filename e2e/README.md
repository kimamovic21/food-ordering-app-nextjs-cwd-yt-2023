# E2E Tests Guide

This folder contains end-to-end style tests for critical user flows using a real test database.

## Current Coverage

- `auth/register-login.e2e.test.ts`
  - register user flow with DB persistence checks
  - credentials login flow through NextAuth authorize handler
  - duplicate email registration protection
- `auth/verify-email.e2e.test.ts`
  - verification-required registration behavior
  - login blocked before email verification
  - resend verification flow
  - invalid/expired verification token behavior
- `auth/forgot-password.e2e.test.ts`
  - forgot-password behavior for credentials users
  - oauth account reset restrictions
  - reset-password flow and login with updated credentials
- `profile/profile-management.e2e.test.ts`
  - profile info update flow
  - profile image upload/remove flow
  - account deletion flow
- `checkout/checkout-payment.e2e.test.ts`
  - order and payment data integration checks against persisted models
  - coupon and cross-restaurant data validation checks
  - ownership-rule related data integrity checks
- `checkout/checkout-menu-availability.e2e.test.ts`
  - checkout blocks unavailable menu items
  - checkout revalidates current menu item data instead of trusting cart state
- `checkout/checkout-restaurant-capacity.e2e.test.ts`
  - checkout blocks active kitchen capacity overloads
  - active orders from other customers count toward the restaurant limit
- `checkout/checkout-restaurant-guards.e2e.test.ts`
  - minimum order amount validation
  - paused restaurant checkout blocks
  - delivery location requirement
  - delivery radius blocks
  - blocked-date ordering protection
- `checkout/checkout-webhook.e2e.test.ts`
  - Stripe webhook payment completion persistence
  - webhook idempotency for repeated checkout completion events
- `checkout/payment-link-recovery.e2e.test.ts`
  - unpaid orders recover an existing open Stripe Checkout URL
  - missing Stripe sessions create and save a replacement Checkout session
  - already-paid Stripe sessions repair local order payment state
- `admin/admin-category-menu-cleanup.e2e.test.ts`
  - admin category and menu item cleanup behavior
- `admin/admin-restaurant-order-review.e2e.test.ts`
  - restaurant owner order flow, coupon behavior, and review moderation checks
- `admin/restaurant-reports.e2e.test.ts`
  - restaurant-scoped daily report data
  - empty report periods return zero values
- `courier/courier-lifecycle.e2e.test.ts`
  - courier assignment, acceptance, handoff, delivery PIN, and completion flow
- `courier/failed-delivery.e2e.test.ts`
  - customer-unavailable requests are blocked before the wait threshold
  - valid failed deliveries notify restaurant admins
  - restaurant owner and super admin verification cancels the order and frees the courier
- `favorites/favorites.full-journey.e2e.test.ts`
  - favorite menu item and restaurant journey
- `messages/messages-flow.e2e.test.ts`
  - role-scoped messaging, conversation access checks, and message persistence
- `support/support-tickets.e2e.test.ts`
  - restaurant-support tickets notify the restaurant owner and super admin
  - app-support tickets route only to super admins
  - ticket status updates notify the reporter

## Environment

E2E tests require:

- `MONGODB_URL_TESTS` in `.env.local`

Example:

- `MONGODB_URL_TESTS=mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests`

## Commands

- Run all e2e tests: `npm run test:e2e`
- Run one e2e file: `npm run test:e2e:file -- e2e/auth/register-login.e2e.test.ts`
- Run profile e2e tests: `npm run test:e2e:profile`
- Run checkout e2e tests: `npm run test:e2e:checkout`
- Run restaurant report e2e tests: `npm run test:e2e:reports`
- Run support e2e tests: `npm run test:e2e:support`
- Run full test pipeline (unit + e2e): `npm run test:all`

## Best Practices

- Keep e2e scope focused on critical flows.
- Avoid asserting implementation details.
- Always clean up test-created data.
- Prefer unique emails or IDs per test execution.
- E2E files run serially because route-handler modules share mocked auth/session state.
- Prefer route-level e2e tests for checkout, webhook, courier, support, and role-gated flows where the database and API handler must agree.
