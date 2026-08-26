/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useFavorites from '@/hooks/useFavorites';

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

const FavoritesConsumer = ({ testId }: { testId: string }) => {
  const { data, loading } = useFavorites();

  return (
    <p data-testid={testId}>
      {loading
        ? 'loading'
        : `${data.favoriteMenuItemIds.join(',')}|${data.favoriteRestaurantIds.join(',')}`}
    </p>
  );
};

describe('useFavorites', () => {
  beforeEach(() => {
    sessionMock.status = 'authenticated';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares one favorites request across multiple consumers', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        favoriteMenuItemIds: ['menu-item-1'],
        favoriteRestaurantIds: ['restaurant-1'],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(
      <>
        <FavoritesConsumer testId='first-favorites' />
        <FavoritesConsumer testId='second-favorites' />
      </>,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByTestId('first-favorites')).toHaveTextContent('menu-item-1|restaurant-1');
      expect(screen.getByTestId('second-favorites')).toHaveTextContent('menu-item-1|restaurant-1');
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not fetch favorites when the user is not authenticated', () => {
    sessionMock.status = 'unauthenticated';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const Wrapper = createWrapper();

    render(<FavoritesConsumer testId='favorites' />, { wrapper: Wrapper });

    expect(screen.getByTestId('favorites')).toHaveTextContent('|');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
