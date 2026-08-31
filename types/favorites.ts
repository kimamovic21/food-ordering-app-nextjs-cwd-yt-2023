import type { EntityId } from '@/types/common';
import type { MenuItemListItem } from '@/types/menu';
import type { RestaurantListItem, RestaurantSummary } from '@/types/restaurant';

export type FavoritesState = {
  favoriteMenuItemIds: EntityId[];
  favoriteRestaurantIds: EntityId[];
};

export type FavoriteType = 'menu-item' | 'restaurant';

export type FavoriteToggleResponse = {
  action?: 'added' | 'removed';
  isFavorite: boolean;
  success?: boolean;
};

export type FavoriteMenuItem = Omit<MenuItemListItem, 'restaurantId'> & {
  restaurantId: EntityId | RestaurantSummary;
};

export type FavoriteMealsResponse = {
  items: FavoriteMenuItem[];
};

export type FavoriteRestaurant = Omit<RestaurantListItem, 'distanceKm'> & {
  distanceKm?: number | null;
};

export type FavoriteRestaurantsResponse = {
  restaurants: FavoriteRestaurant[];
};

export type FavoriteMenuItemsCache = Pick<FavoriteMealsResponse, 'items'>;
export type FavoriteRestaurantsCache = Pick<FavoriteRestaurantsResponse, 'restaurants'>;
