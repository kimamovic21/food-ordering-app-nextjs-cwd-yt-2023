/**
 * @vitest-environment jsdom
 */

import * as Sentry from '@sentry/nextjs';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppErrorBoundary from '@/components/shared/AppErrorBoundary';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-route',
}));

const ThrowingChild = () => {
  throw new Error('Rendered test failure');
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders a fallback and sends client render errors to Sentry', () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Rendered test failure')).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
