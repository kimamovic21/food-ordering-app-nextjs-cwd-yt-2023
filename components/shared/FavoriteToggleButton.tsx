'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { Button } from '@/components/ui/button';
import { emptyFavorites, type FavoritesState } from '@/hooks/useFavorites';
import { queryKeys } from '@/libs/queryKeys';
import type {
  FavoriteMenuItemsCache,
  FavoriteRestaurantsCache,
  FavoriteToggleResponse,
  FavoriteType,
} from '@/types/favorites';

interface FavoriteToggleButtonProps {
  type: FavoriteType;
  targetId: string;
  isFavorite: boolean;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  onChanged?: (isFavorite: boolean) => void;
}

type FavoriteMutationContext = {
  previousFavorites?: FavoritesState;
  previousLocalValue: boolean;
};

const endpointByType: Record<FavoriteType, string> = {
  'menu-item': '/api/favorites/menu-items',
  restaurant: '/api/favorites/restaurants',
};

const labelByType: Record<FavoriteType, string> = {
  'menu-item': 'meal',
  restaurant: 'restaurant',
};

const getFavoriteBody = (type: FavoriteType, targetId: string) =>
  type === 'menu-item' ? { menuItemId: targetId } : { restaurantId: targetId };

const setFavoriteIds = (ids: string[], id: string, isFavorite: boolean) =>
  isFavorite ? Array.from(new Set([...ids, id])) : ids.filter((itemId) => itemId !== id);

const updateFavoritesCache = (
  current: FavoritesState | undefined,
  type: FavoriteType,
  targetId: string,
  isFavorite: boolean
): FavoritesState => {
  const safeCurrent = current || emptyFavorites;

  if (type === 'menu-item') {
    return {
      favoriteMenuItemIds: setFavoriteIds(safeCurrent.favoriteMenuItemIds, targetId, isFavorite),
      favoriteRestaurantIds: safeCurrent.favoriteRestaurantIds,
    };
  }

  return {
    favoriteMenuItemIds: safeCurrent.favoriteMenuItemIds,
    favoriteRestaurantIds: setFavoriteIds(safeCurrent.favoriteRestaurantIds, targetId, isFavorite),
  };
};

const removeFavoriteListItem = (
  queryClient: ReturnType<typeof useQueryClient>,
  type: FavoriteType,
  targetId: string
) => {
  if (type === 'menu-item') {
    queryClient.setQueryData<FavoriteMenuItemsCache>(
      queryKeys.favorites.menuItems(),
      (current) => ({
        items: (current?.items || []).filter((item) => item._id !== targetId),
      })
    );
    return;
  }

  queryClient.setQueryData<FavoriteRestaurantsCache>(
    queryKeys.favorites.restaurants(),
    (current) => ({
      restaurants: (current?.restaurants || []).filter((restaurant) => restaurant._id !== targetId),
    })
  );
};

const FavoriteToggleButton = ({
  type,
  targetId,
  isFavorite,
  className,
  iconClassName,
  showLabel = false,
  onChanged,
}: FavoriteToggleButtonProps) => {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = useState(isFavorite);

  useEffect(() => {
    setLocalValue(isFavorite);
  }, [isFavorite]);

  const favoriteMutation = useMutation<
    FavoriteToggleResponse,
    Error,
    void,
    FavoriteMutationContext
  >({
    mutationFn: async () => {
      const response = await fetch(endpointByType[type], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getFavoriteBody(type, targetId)),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update favorites');
      }

      return {
        action: data?.action,
        isFavorite: Boolean(data?.isFavorite),
        success: Boolean(data?.success),
      };
    },
    onError: (error, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.ids(), context.previousFavorites);
      }

      const previousValue = context?.previousLocalValue ?? isFavorite;
      setLocalValue(previousValue);
      onChanged?.(previousValue);
      sonnerToast.error(error.message || 'Failed to update favorites');
    },
    onMutate: async () => {
      const nextIsFavorite = !localValue;

      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoritesState>(queryKeys.favorites.ids());

      queryClient.setQueryData<FavoritesState>(queryKeys.favorites.ids(), (current) =>
        updateFavoritesCache(current, type, targetId, nextIsFavorite)
      );

      if (!nextIsFavorite) {
        removeFavoriteListItem(queryClient, type, targetId);
      }

      setLocalValue(nextIsFavorite);
      onChanged?.(nextIsFavorite);

      return {
        previousFavorites,
        previousLocalValue: localValue,
      };
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
    onSuccess: (data) => {
      setLocalValue(data.isFavorite);
      onChanged?.(data.isFavorite);
      queryClient.setQueryData<FavoritesState>(queryKeys.favorites.ids(), (current) =>
        updateFavoritesCache(current, type, targetId, data.isFavorite)
      );

      sonnerToast.success(
        data.isFavorite
          ? `Added to favorite ${labelByType[type]}s`
          : `Removed from favorite ${labelByType[type]}s`
      );
    },
  });

  const handleToggle = () => {
    if (status !== 'authenticated') {
      sonnerToast.error('Please login to save favorites');
      return;
    }

    if (!targetId || favoriteMutation.isPending) {
      return;
    }

    favoriteMutation.mutate();
  };

  const isPending = favoriteMutation.isPending;

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className={className}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={localValue ? 'Remove from favorites' : 'Add to favorites'}
      title={localValue ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-4 w-4 ${iconClassName || ''} ${
          localValue ? 'fill-red-500 text-red-500' : 'text-red-500'
        }`}
      />
      {showLabel && <span>{localValue ? 'Favorited' : 'Favorite'}</span>}
    </Button>
  );
};

export default FavoriteToggleButton;
