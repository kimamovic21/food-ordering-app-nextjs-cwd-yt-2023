import { Order } from '@/models/order';

export const ACTIVE_ORDER_STATUSES = [
  'placed',
  'processing',
  'ready',
  'transportation',
  'delivered',
] as const;

export const activeOrderFilter = {
  orderStatus: { $in: ACTIVE_ORDER_STATUSES },
};

export const findBlockingRestaurantOrder = (restaurantId: unknown) =>
  Order.findOne({
    restaurantId,
    ...activeOrderFilter,
  }).select('_id orderStatus');

export const findBlockingMenuItemOrder = (menuItemId: unknown) =>
  Order.findOne({
    'cartProducts.productId': menuItemId,
    ...activeOrderFilter,
  }).select('_id orderStatus');
