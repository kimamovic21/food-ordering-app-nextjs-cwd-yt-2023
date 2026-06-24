export const COURIER_OWN_ORDER_ASSIGNMENT_ERROR =
  'Courier cannot deliver their own order. Please choose another courier.';

export const isCourierOrderOwner = (
  orderUserId?: { toString: () => string } | string | null,
  courierId?: { toString: () => string } | string | null
) => Boolean(orderUserId && courierId && orderUserId.toString() === courierId.toString());
