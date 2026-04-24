# Gemini Testing Notes

## Objective

Use Vitest to cover business-critical logic with small, maintainable tests.

## Layout

- Place tests in `__tests__/` grouped by feature.
- Place reusable test fixtures in `mocks/`.

## Coverage Guidelines

- Prefer route-handler and business-logic tests first.
- Add edge case tests for validation and permissions.
- Keep assertions centered on observable behavior.

## Execution

- Full run: `npm run test`
- Single file: `npm run test:file -- __tests__/path/to/file.test.ts`
- Auth scope: `npm run test:auth`
- E2E run: `npm run test:e2e`
- E2E single file: `npm run test:e2e:file -- e2e/path/to/file.e2e.test.ts`
