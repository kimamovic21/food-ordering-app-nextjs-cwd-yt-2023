# Claude Testing Notes

## Primary Goal

Write tests that verify production behavior without changing stable runtime logic.

## Test Priorities

1. Auth (register/login)
2. Payment and webhook safety
3. Order state transitions
4. Courier assignment and status updates

## Workflow

1. Reuse fixtures from `mocks/`
2. Add focused tests in `__tests__/` by domain
3. Validate both success and failure paths
4. Run `npm run test`, `npm run test:e2e`, and `npm run lint`

## E2E Flow

- Keep e2e tests in `e2e/`.
- Use `MONGODB_URL_TESTS` for real DB-backed test runs.
- Clean up created records after each run.

## Guardrails

- Do not weaken role checks in tests.
- Do not leak secrets into test fixtures.
- Keep tests deterministic and isolated.
