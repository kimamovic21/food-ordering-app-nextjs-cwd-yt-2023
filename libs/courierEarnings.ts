import { format } from 'date-fns';
import { CourierReview } from '@/models/courierReview';
import { Order } from '@/models/order';

const LATE_DELIVERY_GRACE_MINUTES = 15;

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

const roundToTwo = (value: number) => Number(value.toFixed(2));

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
  const declinedAssignments = await Order.countDocuments({
    courierDeclinedBy: courierId,
    courierAssignmentStatus: 'declined',
  });
  const totalEarnings = deliveredOrders.reduce(
    (sum: number, order: any) => sum + (Number(order.deliveryFee) || 0),
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

    current.earnings += Number(order.deliveryFee) || 0;
    current.deliveries += 1;
    earningsByMonth.set(key, current);
  });

  const earningsChart = Array.from(earningsByMonth.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, item]) => ({
      ...item,
      earnings: roundToTwo(item.earnings),
    }));

  return {
    orders: deliveredOrders,
    earningsChart,
    summary: {
      completedDeliveries: deliveredOrders.length,
      declinedAssignments,
      lateDeliveries,
      totalEarnings: roundToTwo(totalEarnings),
      averageEarning: deliveredOrders.length
        ? roundToTwo(totalEarnings / deliveredOrders.length)
        : 0,
      averageDeliveryMinutes: deliveryDurations.length
        ? Math.round(totalDeliveryMinutes / deliveryDurations.length)
        : 0,
      averageRating: Number(ratingSummary[0]?.averageRating || 0),
      ratingCount: Number(ratingSummary[0]?.ratingCount || 0),
    },
  };
};
