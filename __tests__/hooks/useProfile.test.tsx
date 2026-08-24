/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useProfile from '@/hooks/useProfile';

const sessionMock = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'loading',
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionMock,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const QueryTestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return QueryTestWrapper;
};

const ProfileConsumer = ({ testId }: { testId: string }) => {
  const { data, loading } = useProfile();

  return <p data-testid={testId}>{loading ? 'loading' : data?.email || 'empty'}</p>;
};

describe('useProfile', () => {
  beforeEach(() => {
    sessionMock.status = 'authenticated';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares one profile request across multiple consumers', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        _id: 'user-1',
        email: 'kerim@example.com',
        role: 'user',
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(
      <>
        <ProfileConsumer testId='first-profile' />
        <ProfileConsumer testId='second-profile' />
      </>,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByTestId('first-profile')).toHaveTextContent('kerim@example.com');
      expect(screen.getByTestId('second-profile')).toHaveTextContent('kerim@example.com');
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not fetch profile data when the user is not authenticated', () => {
    sessionMock.status = 'unauthenticated';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(<ProfileConsumer testId='profile' />, { wrapper: Wrapper });

    expect(screen.getByTestId('profile')).toHaveTextContent('empty');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
