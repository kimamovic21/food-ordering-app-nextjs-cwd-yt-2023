import { addMoney, divideMoney, roundMoney } from '@/libs/money';
import {
  READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES,
  UNPAID_ORDER_AUTO_CANCEL_MINUTES,
} from '@/libs/orderMaintenanceConfig';
import type {
  RestaurantOperationsAttentionOrder,
  RestaurantOperationsOverview,
  RestaurantOperationsStage,
  RestaurantOperationsStageCount,
  RestaurantOperationsStatus,
  RestaurantOperationsTone,
} from '@/types/operations';

export const OPERATIONS_ACTIVE_STATUSES: RestaurantOperationsStage[] = [
  'placed',
  'processing',
  'ready',
  'transportation',
  'delivered',
];

export const OPERATIONS_KITCHEN_STATUSES = ['placed', 'processing', 'ready'] as const;
export const OPERATIONS_LATE_BEFORE_TRANSPORT_MINUTES = 120;
export const OPERATIONS_READY_WITHOUT_COURIER_WARNING_MINUTES = 15;

const stageLabels: Record<RestaurantOperationsStage, string> = {
  placed: 'Placed',
  processing: 'In kitchen',
  ready: 'Ready',
  transportation: 'In transport',
  delivered: 'Awaiting confirmation',
};

type OperationsOrder = {
  _id: unknown;
  email?: string | null;
  total?: number | null;
  orderStatus?: string | null;
  orderPaid?: boolean | null;
  paid?: boolean | null;
  paymentStatus?: boolean | null;
  courierId?: unknown;
  courierAssignmentStatus?: string | null;
  failedDeliveryRequestedAt?: Date | string | null;
  failedDeliveryVerifiedAt?: Date | string | null;
  readyAt?: Date | string | null;
  createdAt?: Date | string | null;
};

type OperationsRestaurant = {
  _id: unknown;
  name?: string | null;
  isPaused?: boolean | null;
  activeOrderLimit?: number | null;
};

type OrderingStatus = {
  isOpen: boolean;
  isPaused: boolean;
  isAcceptingOrders: boolean;
  isClosingSoonForCheckout: boolean;
  reason?: string | null;
};

const toEntityId = (value: unknown) => String(value || '');

export const isOperationsOrderPaid = (order: OperationsOrder) =>
  Boolean(order.orderPaid || order.paid || order.paymentStatus);

export const getOperationsElapsedMinutes = (
  date: Date | string | null | undefined,
  now = new Date()
) => {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();
  const nowTimestamp = now.getTime();

  if (!Number.isFinite(timestamp) || !Number.isFinite(nowTimestamp)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowTimestamp - timestamp) / 60000));
};

export const buildRestaurantOperationsStageCounts = (
  activeOrders: OperationsOrder[]
): RestaurantOperationsStageCount[] =>
  OPERATIONS_ACTIVE_STATUSES.map((status) => ({
    status,
    label: stageLabels[status],
    count: activeOrders.filter((order) => order.orderStatus === status).length,
  }));

const getAttentionToneRank = (tone: RestaurantOperationsAttentionOrder['tone']) => {
  if (tone === 'danger') return 0;
  if (tone === 'warning') return 1;
  return 2;
};

export const buildRestaurantOperationsAttentionOrders = (
  activeOrders: OperationsOrder[],
  now = new Date()
): RestaurantOperationsAttentionOrder[] =>
  activeOrders
    .map((order): RestaurantOperationsAttentionOrder | null => {
      const orderStatus = String(order.orderStatus || 'placed') as RestaurantOperationsStage;
      const minutesSincePlaced = getOperationsElapsedMinutes(order.createdAt, now);
      const orderId = toEntityId(order._id);

      if (!OPERATIONS_ACTIVE_STATUSES.includes(orderStatus)) {
        return null;
      }

      if (order.failedDeliveryRequestedAt && !order.failedDeliveryVerifiedAt) {
        return {
          _id: orderId,
          email: String(order.email || 'Customer'),
          total: Number(order.total) || 0,
          orderStatus,
          minutesSincePlaced,
          reason: 'Failed delivery needs review',
          description: 'Courier reported the customer unavailable. Verify or reject the request.',
          tone: 'danger',
        };
      }

      if (
        order.orderStatus === 'ready' &&
        !order.courierId &&
        getOperationsElapsedMinutes(order.readyAt, now) >=
          OPERATIONS_READY_WITHOUT_COURIER_WARNING_MINUTES
      ) {
        return {
          _id: orderId,
          email: String(order.email || 'Customer'),
          total: Number(order.total) || 0,
          orderStatus,
          minutesSincePlaced,
          reason: 'Ready without courier',
          description: `No courier has accepted this ready order. It can auto-cancel after ${READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES} minutes.`,
          tone: 'danger',
        };
      }

      if (order.courierAssignmentStatus === 'expired') {
        return {
          _id: orderId,
          email: String(order.email || 'Customer'),
          total: Number(order.total) || 0,
          orderStatus,
          minutesSincePlaced,
          reason: 'Courier assignment expired',
          description: 'The previous courier did not respond. Assign another available courier.',
          tone: 'warning',
        };
      }

      if (
        !['transportation', 'delivered'].includes(orderStatus) &&
        minutesSincePlaced >= OPERATIONS_LATE_BEFORE_TRANSPORT_MINUTES
      ) {
        return {
          _id: orderId,
          email: String(order.email || 'Customer'),
          total: Number(order.total) || 0,
          orderStatus,
          minutesSincePlaced,
          reason: 'Late before transport',
          description: 'This order has been active too long before courier transport started.',
          tone: 'warning',
        };
      }

      if (
        orderStatus === 'placed' &&
        !isOperationsOrderPaid(order) &&
        minutesSincePlaced >= Math.max(1, UNPAID_ORDER_AUTO_CANCEL_MINUTES - 10)
      ) {
        return {
          _id: orderId,
          email: String(order.email || 'Customer'),
          total: Number(order.total) || 0,
          orderStatus,
          minutesSincePlaced,
          reason: 'Payment still pending',
          description: `Checkout is unpaid and can auto-cancel after ${UNPAID_ORDER_AUTO_CANCEL_MINUTES} minutes.`,
          tone: 'neutral',
        };
      }

      return null;
    })
    .filter((order): order is RestaurantOperationsAttentionOrder => Boolean(order))
    .sort(
      (left, right) =>
        getAttentionToneRank(left.tone) - getAttentionToneRank(right.tone) ||
        right.minutesSincePlaced - left.minutesSincePlaced
    )
    .slice(0, 8);

const buildRestaurantStatus = ({
  orderingStatus,
  isAtCapacity,
  isNearCapacity,
}: {
  orderingStatus: OrderingStatus;
  isAtCapacity: boolean;
  isNearCapacity: boolean;
}): RestaurantOperationsStatus => {
  let statusLabel = 'Open';
  let tone: RestaurantOperationsTone = 'success';
  let statusMessage = 'Restaurant is accepting new checkout attempts.';

  if (orderingStatus.isPaused) {
    statusLabel = 'Paused';
    tone = 'warning';
    statusMessage = orderingStatus.reason || 'Restaurant paused new orders.';
  } else if (!orderingStatus.isOpen) {
    statusLabel = 'Closed';
    tone = 'danger';
    statusMessage =
      orderingStatus.reason || 'Restaurant is outside working hours or blocked for today.';
  } else if (orderingStatus.isClosingSoonForCheckout) {
    statusLabel = 'Closing soon';
    tone = 'warning';
    statusMessage =
      orderingStatus.reason || 'Checkout is blocked because the restaurant closes soon.';
  } else if (isAtCapacity) {
    statusLabel = 'At capacity';
    tone = 'danger';
    statusMessage = 'Kitchen reached the active order limit. New checkout is blocked.';
  } else if (isNearCapacity) {
    statusLabel = 'Busy';
    tone = 'warning';
    statusMessage = 'Kitchen is close to capacity. Consider pausing new checkout soon.';
  }

  return {
    isOpen: orderingStatus.isOpen,
    isPaused: orderingStatus.isPaused,
    isAcceptingOrders: orderingStatus.isAcceptingOrders && !isAtCapacity,
    isClosingSoonForCheckout: orderingStatus.isClosingSoonForCheckout,
    statusLabel,
    statusMessage,
    tone,
  };
};

export const buildRestaurantOperationsOverview = ({
  restaurant,
  todayOrders,
  activeOrders,
  availableCouriers,
  totalCouriers,
  orderingStatus,
  todayLabel,
  now = new Date(),
}: {
  restaurant: OperationsRestaurant;
  todayOrders: OperationsOrder[];
  activeOrders: OperationsOrder[];
  availableCouriers: number;
  totalCouriers: number;
  orderingStatus: OrderingStatus;
  todayLabel: string;
  now?: Date;
}): RestaurantOperationsOverview => {
  const activeOrderLimit = Math.min(100, Math.max(1, Number(restaurant.activeOrderLimit) || 10));
  const activeKitchenOrders = activeOrders.filter(
    (order) =>
      OPERATIONS_KITCHEN_STATUSES.some((status) => status === order.orderStatus) &&
      isOperationsOrderPaid(order)
  ).length;
  const capacityUsagePercent = Math.min(
    100,
    Math.round((activeKitchenOrders / activeOrderLimit) * 100)
  );
  const busySuggestionThreshold = Math.max(1, activeOrderLimit - 2);
  const isAtCapacity = activeKitchenOrders >= activeOrderLimit;
  const isNearCapacity =
    activeKitchenOrders >= busySuggestionThreshold && activeKitchenOrders < activeOrderLimit;
  const paidToday = todayOrders.filter(isOperationsOrderPaid);
  const revenueOrders = paidToday.filter((order) => order.orderStatus !== 'canceled');
  const revenue = roundMoney(
    revenueOrders.reduce((sum, order) => addMoney(sum, Number(order.total) || 0), 0)
  );
  const paidOrders = paidToday.length;
  const activeToday = todayOrders.filter((order) =>
    OPERATIONS_ACTIVE_STATUSES.includes(order.orderStatus as RestaurantOperationsStage)
  );

  return {
    restaurant: {
      _id: toEntityId(restaurant._id),
      name: String(restaurant.name || 'Restaurant'),
      activeKitchenOrders,
      activeOrderLimit,
      capacityUsagePercent,
      isNearCapacity,
      isAtCapacity,
      shouldSuggestPause: !restaurant.isPaused && isNearCapacity,
      status: buildRestaurantStatus({
        orderingStatus,
        isAtCapacity,
        isNearCapacity,
      }),
    },
    today: {
      label: todayLabel,
      totalOrders: todayOrders.length,
      activeOrders: activeToday.length,
      paidOrders,
      unpaidOrders: todayOrders.length - paidOrders,
      completedOrders: todayOrders.filter((order) => order.orderStatus === 'completed').length,
      canceledOrders: todayOrders.filter((order) => order.orderStatus === 'canceled').length,
      revenue,
      averageOrderValue: paidOrders > 0 ? divideMoney(revenue, paidOrders) : 0,
    },
    couriers: {
      availableCouriers,
      totalCouriers,
      unavailableCouriers: Math.max(0, totalCouriers - availableCouriers),
    },
    stageCounts: buildRestaurantOperationsStageCounts(activeOrders),
    attentionOrders: buildRestaurantOperationsAttentionOrders(activeOrders, now),
    lateThresholdMinutes: OPERATIONS_LATE_BEFORE_TRANSPORT_MINUTES,
    updatedAt: now.toISOString(),
  };
};
