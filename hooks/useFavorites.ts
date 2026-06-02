import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface FavoritesState {
  favoriteMenuItemIds: string[];
  favoriteRestaurantIds: string[];
}

const useFavorites = () => {
  const { status } = useSession();
  const [data, setData] = useState<FavoritesState>({
    favoriteMenuItemIds: [],
    favoriteRestaurantIds: [],
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setData({ favoriteMenuItemIds: [], favoriteRestaurantIds: [] });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/favorites', { cache: 'no-store' });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to load favorites');
      }

      setData({
        favoriteMenuItemIds: Array.isArray(json.favoriteMenuItemIds)
          ? json.favoriteMenuItemIds
          : [],
        favoriteRestaurantIds: Array.isArray(json.favoriteRestaurantIds)
          ? json.favoriteRestaurantIds
          : [],
      });
    } catch {
      setData({ favoriteMenuItemIds: [], favoriteRestaurantIds: [] });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setMenuItemFavorite = (id: string, isFavorite: boolean) => {
    setData((prev) => ({
      ...prev,
      favoriteMenuItemIds: isFavorite
        ? Array.from(new Set([...prev.favoriteMenuItemIds, id]))
        : prev.favoriteMenuItemIds.filter((itemId) => itemId !== id),
    }));
  };

  const setRestaurantFavorite = (id: string, isFavorite: boolean) => {
    setData((prev) => ({
      ...prev,
      favoriteRestaurantIds: isFavorite
        ? Array.from(new Set([...prev.favoriteRestaurantIds, id]))
        : prev.favoriteRestaurantIds.filter((itemId) => itemId !== id),
    }));
  };

  return {
    data,
    loading,
    refresh,
    setMenuItemFavorite,
    setRestaurantFavorite,
  };
};

export default useFavorites;
