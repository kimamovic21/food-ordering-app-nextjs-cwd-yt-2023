'use client';

import { useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { queryKeys } from '@/libs/queryKeys';

export const RESTAURANT_ORDERING_STATUS_STALE_MS = 30 * 1000;

export type RestaurantOrderingStatus = {
  restaurantId: string;
  restaurantName: string;
  isAcceptingOrders: boolean;
  reason?: string | null;
};

export const fetchRestaurantOrderingStatus = async (
  restaurantId: string
): Promise<RestaurantOrderingStatus> => {
  const response = await fetch(`/api/restaurants/${restaurantId}/ordering-status`, {
    cache: 'no-store',
  });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Unable to check restaurant status.');
  }

  return json;
};

const getRestaurantOrderingStatusQuery = (restaurantId: string) => ({
  queryKey: queryKeys.restaurants.orderingStatus(restaurantId),
  queryFn: () => fetchRestaurantOrderingStatus(restaurantId),
  staleTime: RESTAURANT_ORDERING_STATUS_STALE_MS,
});

export const prefetchRestaurantOrderingStatuses = async (
  queryClient: QueryClient,
  restaurantIds: string[]
) => {
  const uniqueRestaurantIds = Array.from(
    new Set(
      restaurantIds
        .map((restaurantId) => restaurantId.trim())
        .filter((restaurantId) => restaurantId && restaurantId !== 'default')
    )
  );

  await Promise.allSettled(
    uniqueRestaurantIds.map((restaurantId) =>
      queryClient.prefetchQuery(getRestaurantOrderingStatusQuery(restaurantId))
    )
  );
};

const useRestaurantOrderingGate = () => {
  const queryClient = useQueryClient();
  const [checkingRestaurantId, setCheckingRestaurantId] = useState<string | null>(null);

  const assertRestaurantCanAcceptOrders = async (restaurantId: string) => {
    if (!restaurantId || restaurantId === 'default') {
      return true;
    }

    setCheckingRestaurantId(restaurantId);

    try {
      const status = await queryClient.fetchQuery(getRestaurantOrderingStatusQuery(restaurantId));

      if (!status.isAcceptingOrders) {
        sonnerToast.error(`${status.restaurantName || 'This restaurant'} is not accepting orders`, {
          description:
            status.reason ||
            'Please try again later or choose a different restaurant from the menu.',
          duration: 5000,
        });
        return false;
      }

      return true;
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Unable to check restaurant.');
      return false;
    } finally {
      setCheckingRestaurantId(null);
    }
  };

  return {
    assertRestaurantCanAcceptOrders,
    checkingRestaurantId,
  };
};

export default useRestaurantOrderingGate;
