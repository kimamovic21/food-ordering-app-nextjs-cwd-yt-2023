# Test Suite Guide

This folder contains unit tests grouped by feature area.

## Current Coverage

- `auth/credentials-authorize.test.ts`: validates credentials authorization behavior.
- `api/register.route.test.ts`: validates registration rules and role assignment.
- `api/verify-email.route.test.ts`: validates verification-token route behavior.
- `api/forgot-password.route.test.ts`: validates forgot-password route behavior.
- `api/reset-password.route.test.ts`: validates reset-password route behavior.
- `api/profile.route.test.ts`: validates profile fetch/update/delete behavior.
- `api/delivery-addresses.route.test.ts`: validates saved delivery address CRUD, duplicate reuse, defaults, limits, and location requirements.
- `api/my-orders-active.route.test.ts`: validates active customer order lookup and stale-order cancellation filtering.
- `api/restaurant-ordering-status.route.test.ts`: validates public restaurant ordering status and active capacity responses.
- `api/profile-change-password.route.test.ts`: validates password change API behavior.
- `api/upload-users.route.test.ts`: validates profile image upload/remove behavior.
- `api/checkout.route.test.ts`: validates checkout guardrails and failure handling.
- `api/courier-assignment.route.test.ts`: validates courier assignment guardrails and courier-only assignment notes.
- `api/courier-earnings.route.test.ts`: validates courier earnings access, summaries, and assignment reliability metrics.
- `api/my-deliveries.route.test.ts`: validates courier delivery history, performance summaries, and assignment reliability metrics.
- `api/realtime-streams.route.test.ts`: validates authenticated SSE streams for messages and notifications.
- `api/restaurant.route.test.ts`: validates restaurant settings, ownership, and deletion behavior.
- `api/restaurant-operations.route.test.ts`: validates restaurant operations overview API summaries and admin restaurant scoping.
- `api/webhook.route.test.ts`: validates webhook signature/idempotency behavior.
- `api/payment.test.ts`: validates payment-related helper logic and utility contracts.
- `libs/courier-assignment-timeout.test.ts`: validates stale pending courier assignment expiry and courier release rules.
- `libs/courier-assignment-history.test.ts`: validates finalized courier assignment attempt history.
- `libs/order-auto-cancellation.test.ts`: validates stale unpaid and ready-without-courier auto-cancel rules.
- `libs/paymentExpiry.test.ts`: validates the customer-facing unpaid payment countdown helper.
- `libs/deliveryAddresses.test.ts`: validates saved delivery address normalization and duplicate matching.
- `libs/orderDelay.test.ts`: validates active order delay warning thresholds and development time offsets.
- `libs/restaurantOperations.test.ts`: validates operations overview stage counts, capacity, courier summary, revenue, and attention-order prioritization.
- `hooks/useRestaurantOrderingGate.test.ts`: validates restaurant ordering-status prefetch caching for visible menu items.
- `libs/realtimeClient.test.ts`: validates client-side realtime payload helpers.

## Structure Rules

- Keep test files close to business domain in nested folders.
- Name test files with `*.test.ts`.
- Put reusable input fixtures in the root `mocks/` folder.
- Use `utils/testFactories.ts` for generated fake users, restaurants, and orders.
- Use `utils/mongoMemoryServer.ts` when a test needs an isolated in-memory MongoDB instance.
- Focus on behavior contracts, not implementation details.
- Update this README when new unit-test domains, helper utilities, or focused test commands are added.
- Keep this file aligned with `TESTING.md` and `e2e/README.md` when the test strategy changes.

## Running Tests

- Run all tests: `npm run test`
- Watch mode: `npm run test:watch`
- Run a single test file: `npm run test:file -- __tests__/api/register.route.test.ts`
- Run profile unit tests: `npm run test:profile`
- Run payment/webhook-focused unit tests: `npm run test:payment`
- Run realtime/SSE tests: `npm run test:realtime`

## E2E Tests

- End-to-end style tests are kept in `e2e/`.
- See `e2e/README.md` for e2e commands and behavior.

## Environment

- Tests use `MONGODB_URL_TESTS` when available.
- If missing, setup falls back to the local default test DB URL.
