import type { EntityId, ISODateString } from '@/types/common';
import type { OrderStatus } from '@/types/order';

export type RestaurantOperationsStage = Extract<
  OrderStatus,
  'placed' | 'processing' | 'ready' | 'transportation' | 'delivered'
>;

export type RestaurantOperationsTone = 'success' | 'warning' | 'danger' | 'neutral';

export type RestaurantOperationsStatus = {
  isOpen: boolean;
  isPaused: boolean;
  isAcceptingOrders: boolean;
  isClosingSoonForCheckout: boolean;
  statusLabel: string;
  statusMessage: string;
  tone: RestaurantOperationsTone;
};

export type RestaurantOperationsRestaurant = {
  _id: EntityId;
  name: string;
  activeKitchenOrders: number;
  activeOrderLimit: number;
  capacityUsagePercent: number;
  isNearCapacity: boolean;
  isAtCapacity: boolean;
  shouldSuggestPause: boolean;
  status: RestaurantOperationsStatus;
};

export type RestaurantOperationsStageCount = {
  status: RestaurantOperationsStage;
  label: string;
  count: number;
};

export type RestaurantOperationsTodaySummary = {
  label: string;
  totalOrders: number;
  activeOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  canceledOrders: number;
  revenue: number;
  averageOrderValue: number;
};

export type RestaurantOperationsCourierSummary = {
  availableCouriers: number;
  totalCouriers: number;
  unavailableCouriers: number;
};

export type RestaurantOperationsAttentionOrder = {
  _id: EntityId;
  email: string;
  total: number;
  orderStatus: RestaurantOperationsStage;
  minutesSincePlaced: number;
  reason: string;
  description: string;
  tone: Exclude<RestaurantOperationsTone, 'success'>;
};

export type RestaurantOperationsOverview = {
  restaurant: RestaurantOperationsRestaurant;
  today: RestaurantOperationsTodaySummary;
  couriers: RestaurantOperationsCourierSummary;
  stageCounts: RestaurantOperationsStageCount[];
  attentionOrders: RestaurantOperationsAttentionOrder[];
  lateThresholdMinutes: number;
  updatedAt: ISODateString;
};
