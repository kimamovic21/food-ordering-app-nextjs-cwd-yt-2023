'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys } from '@/libs/queryKeys';
import type { FavoritesState } from '@/types/favorites';

export type { FavoritesState } from '@/types/favorites';

export const emptyFavorites: FavoritesState = {
  favoriteMenuItemIds: [],
  favoriteRestaurantIds: [],
};

const normalizeFavoriteIds = (value: unknown) =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];

export const fetchFavoriteIds = async (): Promise<FavoritesState> => {
  const response = await fetch('/api/favorites', { cache: 'no-store' });
  const json = await response.json().catch(() => null);

  if (response.status === 401) {
    return emptyFavorites;
  }

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to load favorites');
  }

  return {
    favoriteMenuItemIds: normalizeFavoriteIds(json?.favoriteMenuItemIds),
    favoriteRestaurantIds: normalizeFavoriteIds(json?.favoriteRestaurantIds),
  };
};

const setFavoriteIds = (ids: string[], id: string, isFavorite: boolean) => {
  if (!id) {
    return ids;
  }

  return isFavorite ? Array.from(new Set([...ids, id])) : ids.filter((itemId) => itemId !== id);
};

const useFavorites = () => {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';

  const favoritesQuery = useQuery({
    enabled: isAuthenticated,
    gcTime: 10 * 60 * 1000,
    queryFn: fetchFavoriteIds,
    queryKey: queryKeys.favorites.ids(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
    }
  }, [isAuthenticated, queryClient]);

  const setMenuItemFavorite = useCallback(
    (id: string, isFavorite: boolean) => {
      queryClient.setQueryData<FavoritesState>(queryKeys.favorites.ids(), (current) => ({
        favoriteMenuItemIds: setFavoriteIds(current?.favoriteMenuItemIds || [], id, isFavorite),
        favoriteRestaurantIds: current?.favoriteRestaurantIds || [],
      }));
    },
    [queryClient]
  );

  const setRestaurantFavorite = useCallback(
    (id: string, isFavorite: boolean) => {
      queryClient.setQueryData<FavoritesState>(queryKeys.favorites.ids(), (current) => ({
        favoriteMenuItemIds: current?.favoriteMenuItemIds || [],
        favoriteRestaurantIds: setFavoriteIds(current?.favoriteRestaurantIds || [], id, isFavorite),
      }));
    },
    [queryClient]
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
  }, [queryClient]);

  return {
    data: isAuthenticated ? (favoritesQuery.data ?? emptyFavorites) : emptyFavorites,
    error: favoritesQuery.error,
    loading: status === 'loading' || (isAuthenticated && favoritesQuery.isLoading),
    refresh,
    setMenuItemFavorite,
    setRestaurantFavorite,
  };
};

export default useFavorites;
