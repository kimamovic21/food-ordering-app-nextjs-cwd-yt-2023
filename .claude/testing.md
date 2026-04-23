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
4. Run `npm run test` and `npm run lint`

## Guardrails

- Do not weaken role checks in tests.
- Do not leak secrets into test fixtures.
- Keep tests deterministic and isolated.
