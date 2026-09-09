import type { EntityId } from '@/types/common';

export type CartSize = 'small' | 'medium' | 'large' | 'single';

export interface CartItem {
  _id: EntityId;
  name: string;
  description: string;
  image?: string;
  size: CartSize;
  price: number | null;
  quantity: number;
  restaurantId: EntityId;
}

export type CheckoutCartItemPayload = {
  _id: EntityId;
  name: string;
  size: string;
  price: number;
  quantity: number;
  restaurantId: EntityId;
};

export type CartProduct = {
  productId: EntityId;
  name: string;
  size: string;
  quantity: number;
  price: number;
  restaurantId?: EntityId;
};

export type CartValidationRequestItem = {
  _id?: EntityId;
  size?: string;
  quantity?: number;
  restaurantId?: EntityId;
  price?: number | null;
};

export type CartValidationStatus = 'valid' | 'unavailable' | 'deleted' | 'invalid_size' | 'invalid';

export type CartValidationRestaurantStatus =
  | 'valid'
  | 'missing'
  | 'multiple_restaurants'
  | 'restaurant_mismatch'
  | 'closed'
  | 'paused'
  | 'closing_soon'
  | 'busy'
  | 'below_minimum'
  | 'outside_delivery_radius'
  | 'missing_delivery_location';

export type CartValidationItem = {
  _id?: EntityId;
  itemKey: string;
  requestedSize?: CartSize | null;
  status: CartValidationStatus;
  name?: string;
  image?: string | null;
  size?: CartSize | string;
  price?: number;
  restaurantId?: EntityId;
  previousPrice?: number | null;
  priceChanged?: boolean;
  message?: string | null;
};

export type CartValidationResponse = {
  items: CartValidationItem[];
  canCheckout: boolean;
  message?: string | null;
  restaurant?: {
    restaurantId?: EntityId;
    restaurantName?: string;
    status: CartValidationRestaurantStatus;
    canCheckout: boolean;
    message?: string | null;
    subtotal?: number;
    minimumOrderAmount?: number;
    deliveryRadiusKm?: number;
    distanceKm?: number | null;
    isOpen?: boolean;
    isPaused?: boolean;
    isBusy?: boolean;
    isAcceptingOrders?: boolean;
  } | null;
};

export type CheckoutStartResult = {
  paid: boolean;
};
