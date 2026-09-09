import type { CartItem, CartProduct } from '@/types/cart';
import type { EntityId, ISODateString } from '@/types/common';
import type { UserSummary } from '@/types/user';

export type OrderStatus =
  'placed' | 'processing' | 'ready' | 'transportation' | 'delivered' | 'completed' | 'canceled';

export type EditableOrderStatus = Extract<OrderStatus, 'placed' | 'processing' | 'ready'>;
export type CourierAssignmentStatus = 'pending' | 'accepted' | 'declined' | 'expired' | null;
export type DeliveryCompletedBy = 'customer' | 'admin' | null;
export type OrderCanceledBy = 'customer' | 'restaurant_owner' | 'super_admin' | 'system' | null;
export type FailedDeliveryVerifiedByRole = 'restaurant_owner' | 'super_admin' | null;

export type OrderListItem = {
  _id: EntityId;
  email: string;
  total: number;
  paymentStatus: boolean;
  orderStatus: OrderStatus;
  createdAt: ISODateString;
};

export type OrderReview = {
  rating: number;
  reviewText: string;
  createdAt?: ISODateString;
};

export type OrderDetails = OrderListItem & {
  userId: EntityId;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryDistanceKm?: number | null;
  specialInstructions?: string;
  cartProducts: CartProduct[];
  updatedAt: ISODateString;
  processingAt?: ISODateString | null;
  readyAt?: ISODateString | null;
  transportationAt?: ISODateString | null;
  courierDeliveredAt?: ISODateString | null;
  customerConfirmedDeliveryAt?: ISODateString | null;
  adminConfirmedDeliveryAt?: ISODateString | null;
  deliveryCompletedBy?: DeliveryCompletedBy;
  deliveryPin?: string | null;
  courierId?: UserSummary | EntityId | null;
  courier?: UserSummary | null;
  courierAssignmentStatus?: CourierAssignmentStatus;
  courierAssignmentNote?: string;
  receiptEmailSentAt?: ISODateString | null;
  courierAssignedAt?: ISODateString | null;
  courierAcceptedAt?: ISODateString | null;
  courierDeclinedAt?: ISODateString | null;
  courierAssignmentExpiredAt?: ISODateString | null;
  courierAssignmentExpiredCourierId?: EntityId | null;
  restaurantHandedToCourierAt?: ISODateString | null;
  courierPickedUpAt?: ISODateString | null;
  failedDeliveryRequestedAt?: ISODateString | null;
  failedDeliveryRequestedBy?: EntityId | null;
  failedDeliveryReason?: string | null;
  failedDeliveryVerifiedAt?: ISODateString | null;
  failedDeliveryVerifiedBy?: EntityId | null;
  failedDeliveryVerifiedByRole?: FailedDeliveryVerifiedByRole;
  canceledBy?: OrderCanceledBy;
  cancellationReason?: string | null;
  canceledAt?: ISODateString | null;
  completedAt?: ISODateString | null;
  stripeSessionId?: string;
  taxPercentage?: number;
  taxAmount?: number;
  deliveryFee?: number;
  estimatedPreparationMinutes?: number | null;
  estimatedDeliveryMinutes?: number | null;
  estimatedTotalMinutes?: number | null;
  loyaltyDiscount?: number;
  loyaltyDiscountPercentage?: number;
  loyaltyTier?: string | null;
  restaurantId?: EntityId;
};

export type CourierDeliveryOrder = OrderDetails & {
  courierId?: UserSummary | null;
};

export type AdminOrderDetails = Omit<OrderDetails, 'courierId'> & {
  courierId?: UserSummary | null;
  adminInternalNote?: string;
};

export type CustomerOrderDetails = Omit<OrderDetails, 'courierId'> & {
  courier?: UserSummary | null;
};

export type DeliveredOrder = {
  _id: EntityId;
  userId: EntityId;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  specialInstructions?: string;
  cartProducts: CartProduct[];
  estimatedDeliveryMinutes?: number | null;
  deliveryFee?: number;
  loyaltyDiscount?: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponDiscountPercentage?: number;
  total: number;
  orderPaid: boolean;
  orderStatus: OrderStatus | string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type QueueOrder = {
  _id: EntityId;
  email: string;
  phone: string;
  total: number;
  paymentStatus: boolean;
  orderStatus: Exclude<OrderStatus, 'completed' | 'canceled'>;
  courierAssignmentStatus?: CourierAssignmentStatus;
  courierAssignmentExpiredAt?: ISODateString | null;
  minutesSincePlaced: number;
  isLateBeforeTransport: boolean;
  isCourierAssignmentExpired?: boolean;
  isReadyWithoutCourierLate?: boolean;
  cartProducts: Array<{ name: string; quantity: number; size: string }>;
  courierId?: Pick<UserSummary, 'name' | 'email'> | null;
};

export type UsualOrder = {
  orderId: EntityId;
  repeatCount: number;
  lastOrderedAt: ISODateString;
  itemCount: number;
  subtotal: number;
  items: { name: string; size: string; quantity: number }[];
  cartItems: CartItem[];
};
