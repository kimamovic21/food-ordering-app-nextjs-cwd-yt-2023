import { format } from 'date-fns';
import { addMoney, divideMoney, roundMoney } from '@/libs/money';
import { CourierReview } from '@/models/courierReview';
import { Order } from '@/models/order';

const LATE_DELIVERY_GRACE_MINUTES = 15;
type AssignmentMetricStatus = 'accepted' | 'declined' | 'expired';

type AssignmentMetricEntry = {
  orderId?: unknown;
  status: AssignmentMetricStatus;
  assignedAt?: Date | string | null;
  respondedAt?: Date | string | null;
};

const getMinutesBetween = (start?: Date | string | null, end?: Date | string | null) => {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
};

const getOrderCompletionDate = (order: any) => {
  const date = new Date(order.completedAt || order.courierDeliveredAt || order.updatedAt);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getDate = (value: Date | string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getIdText = (value: any) => value?._id?.toString?.() || value?.toString?.() || '';

const isSameId = (left: unknown, right: unknown) => getIdText(left) === getIdText(right);

const pushUniqueAssignmentEntry = (
  entries: AssignmentMetricEntry[],
  seen: Set<string>,
  entry: AssignmentMetricEntry
) => {
  const assignedAt = getDate(entry.assignedAt)?.toISOString() || '';
  const respondedAt = getDate(entry.respondedAt)?.toISOString() || '';
  const key = `${getIdText(entry.orderId)}:${entry.status}:${assignedAt}:${respondedAt}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  entries.push(entry);
};

const getCourierAssignmentMetrics = async (courierId: unknown) => {
  const assignmentOrders = await Order.find({
    $or: [
      { 'courierAssignmentHistory.courierId': courierId },
      { courierId, courierAssignmentStatus: 'accepted' },
      { courierDeclinedBy: courierId, courierAssignmentStatus: 'declined' },
      { courierAssignmentExpiredCourierId: courierId },
    ],
  })
    .select(
      'courierAssignmentHistory courierId courierAssignmentStatus courierAssignedAt courierAcceptedAt courierDeclinedBy courierDeclinedAt courierAssignmentExpiredCourierId courierAssignmentExpiredAt'
    )
    .lean();
  const entries: AssignmentMetricEntry[] = [];
  const seen = new Set<string>();

  assignmentOrders.forEach((order: any) => {
    if (Array.isArray(order.courierAssignmentHistory)) {
      order.courierAssignmentHistory.forEach((historyItem: any) => {
        if (!isSameId(historyItem.courierId, courierId)) {
          return;
        }

        if (!['accepted', 'declined', 'expired'].includes(historyItem.status)) {
          return;
        }

        pushUniqueAssignmentEntry(entries, seen, {
          orderId: order._id,
          status: historyItem.status,
          assignedAt: historyItem.assignedAt,
          respondedAt: historyItem.respondedAt,
        });
      });
    }

    if (isSameId(order.courierId, courierId) && order.courierAssignmentStatus === 'accepted') {
      pushUniqueAssignmentEntry(entries, seen, {
        orderId: order._id,
        status: 'accepted',
        assignedAt: order.courierAssignedAt,
        respondedAt: order.courierAcceptedAt,
      });
    }

    if (
      isSameId(order.courierDeclinedBy, courierId) &&
      order.courierAssignmentStatus === 'declined'
    ) {
      pushUniqueAssignmentEntry(entries, seen, {
        orderId: order._id,
        status: 'declined',
        assignedAt: order.courierAssignedAt,
        respondedAt: order.courierDeclinedAt,
      });
    }

    if (isSameId(order.courierAssignmentExpiredCourierId, courierId)) {
      pushUniqueAssignmentEntry(entries, seen, {
        orderId: order._id,
        status: 'expired',
        assignedAt: order.courierAssignedAt,
        respondedAt: order.courierAssignmentExpiredAt,
      });
    }
  });

  const acceptedAssignments = entries.filter((entry) => entry.status === 'accepted').length;
  const declinedAssignments = entries.filter((entry) => entry.status === 'declined').length;
  const missedAssignments = entries.filter((entry) => entry.status === 'expired').length;
  const respondedAssignments = acceptedAssignments + declinedAssignments;
  const totalAssignments = entries.length;
  const responseDurations = entries
    .filter((entry) => entry.status !== 'expired')
    .map((entry) => getMinutesBetween(entry.assignedAt, entry.respondedAt))
    .filter((duration): duration is number => typeof duration === 'number');
  const totalResponseMinutes = responseDurations.reduce((sum, duration) => sum + duration, 0);

  return {
    totalAssignments,
    acceptedAssignments,
    respondedAssignments,
    declinedAssignments,
    missedAssignments,
    averageResponseMinutes: responseDurations.length
      ? Math.round(totalResponseMinutes / responseDurations.length)
      : 0,
    assignmentResponseRate: totalAssignments
      ? Math.round((respondedAssignments / totalAssignments) * 100)
      : 0,
    assignmentAcceptanceRate: respondedAssignments
      ? Math.round((acceptedAssignments / respondedAssignments) * 100)
      : 0,
  };
};

export const getCourierEarningsReport = async (courierId: unknown) => {
  const deliveredOrders = await Order.find({
    courierId,
    orderStatus: 'completed',
  })
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean();

  const deliveryDurations = deliveredOrders
    .map((order: any) =>
      getMinutesBetween(
        order.courierPickedUpAt || order.transportationAt,
        order.courierDeliveredAt || order.completedAt || order.updatedAt
      )
    )
    .filter((duration): duration is number => typeof duration === 'number');
  const totalDeliveryMinutes = deliveryDurations.reduce((sum, duration) => sum + duration, 0);
  const lateDeliveries = deliveredOrders.filter((order: any) => {
    const duration = getMinutesBetween(
      order.courierPickedUpAt || order.transportationAt,
      order.courierDeliveredAt || order.completedAt || order.updatedAt
    );
    const estimate = Number(order.estimatedDeliveryMinutes) || 0;

    return typeof duration === 'number' && estimate > 0
      ? duration > estimate + LATE_DELIVERY_GRACE_MINUTES
      : false;
  }).length;
  const assignmentMetrics = await getCourierAssignmentMetrics(courierId);
  const totalEarnings = deliveredOrders.reduce(
    (sum: number, order: any) => addMoney(sum, Number(order.deliveryFee) || 0),
    0
  );
  const ratingSummary = await CourierReview.aggregate([
    { $match: { courierId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);
  const earningsByMonth = new Map<
    string,
    { month: string; earnings: number; deliveries: number }
  >();

  deliveredOrders.forEach((order: any) => {
    const completionDate = getOrderCompletionDate(order);

    if (!completionDate) {
      return;
    }

    const key = format(completionDate, 'yyyy-MM');
    const current = earningsByMonth.get(key) || {
      month: format(completionDate, 'MMM yyyy'),
      earnings: 0,
      deliveries: 0,
    };

    current.earnings = addMoney(current.earnings, Number(order.deliveryFee) || 0);
    current.deliveries += 1;
    earningsByMonth.set(key, current);
  });

  const earningsChart = Array.from(earningsByMonth.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, item]) => ({
      ...item,
      earnings: roundMoney(item.earnings),
    }));

  return {
    orders: deliveredOrders,
    earningsChart,
    summary: {
      completedDeliveries: deliveredOrders.length,
      totalAssignments: assignmentMetrics.totalAssignments,
      acceptedAssignments: assignmentMetrics.acceptedAssignments,
      respondedAssignments: assignmentMetrics.respondedAssignments,
      declinedAssignments: assignmentMetrics.declinedAssignments,
      missedAssignments: assignmentMetrics.missedAssignments,
      lateDeliveries,
      totalEarnings: roundMoney(totalEarnings),
      averageEarning: deliveredOrders.length
        ? divideMoney(totalEarnings, deliveredOrders.length)
        : 0,
      averageDeliveryMinutes: deliveryDurations.length
        ? Math.round(totalDeliveryMinutes / deliveryDurations.length)
        : 0,
      averageResponseMinutes: assignmentMetrics.averageResponseMinutes,
      assignmentResponseRate: assignmentMetrics.assignmentResponseRate,
      assignmentAcceptanceRate: assignmentMetrics.assignmentAcceptanceRate,
      averageRating: Number(ratingSummary[0]?.averageRating || 0),
      ratingCount: Number(ratingSummary[0]?.ratingCount || 0),
    },
  };
};
