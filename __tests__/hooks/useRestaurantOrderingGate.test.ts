import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { queryKeys } from '@/libs/queryKeys';
import { prefetchRestaurantOrderingStatuses } from '@/hooks/useRestaurantOrderingGate';

describe('restaurant ordering status prefetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefetches unique restaurant ordering statuses into TanStack Query cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const fetchMock = vi.fn(async () =>
      Response.json({
        restaurantId: 'restaurant-1',
        restaurantName: 'Pizza Hub',
        isAcceptingOrders: true,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await prefetchRestaurantOrderingStatuses(queryClient, [
      'restaurant-1',
      'restaurant-1',
      'default',
      '',
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurants/restaurant-1/ordering-status', {
      cache: 'no-store',
    });
    expect(queryClient.getQueryData(queryKeys.restaurants.orderingStatus('restaurant-1'))).toEqual(
      expect.objectContaining({
        restaurantId: 'restaurant-1',
        isAcceptingOrders: true,
      })
    );
  });
});
