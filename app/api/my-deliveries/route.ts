import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { CourierReview } from '@/models/courierReview';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import mongoose from 'mongoose';

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

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only couriers can access this' }, { status: 403 });
  }

  const deliveredOrders = await Order.find({
    courierId: user._id,
    orderStatus: 'completed',
  })
    .sort({ updatedAt: -1 })
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
    courierDeclinedBy: user._id,
    courierAssignmentStatus: 'declined',
  });
  const deliveryDistances = deliveredOrders
    .map((order: any) => Number(order.deliveryDistanceKm))
    .filter((distance) => Number.isFinite(distance) && distance > 0);
  const totalDistanceKm = deliveryDistances.reduce((sum, distance) => sum + distance, 0);
  const ratingSummary = await CourierReview.aggregate([
    { $match: { courierId: user._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  return Response.json({
    orders: deliveredOrders,
    summary: {
      completedDeliveries: deliveredOrders.length,
      declinedAssignments,
      lateDeliveries,
      averageDeliveryMinutes: deliveryDurations.length
        ? Math.round(totalDeliveryMinutes / deliveryDurations.length)
        : 0,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      averageDistanceKm: deliveryDistances.length
        ? Number((totalDistanceKm / deliveryDistances.length).toFixed(1))
        : 0,
      averageRating: Number(ratingSummary[0]?.averageRating || 0),
      ratingCount: Number(ratingSummary[0]?.ratingCount || 0),
    },
  });
}
