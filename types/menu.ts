import type { EntityId } from '@/types/common';

export type MenuItemPriceType = 'single' | 'double' | 'triple';
export type MenuItemFoodType = 'food' | 'drink';

export type MenuItemCategory = {
  _id: EntityId;
  name: string;
};

export type MenuItemListItem = {
  _id: EntityId;
  image?: string;
  name: string;
  description: string;
  category?: MenuItemCategory | EntityId;
  priceType?: MenuItemPriceType | string;
  foodType?: MenuItemFoodType | string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  adminId?: EntityId;
  restaurantId: EntityId;
  isAvailable?: boolean;
  restaurantAverageRating?: number;
  restaurantRatingCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuCategorySummary = {
  _id: EntityId;
  name: string;
  items: MenuItemListItem[];
  total: number;
};
