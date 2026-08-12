import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { notifyRestaurantAdminsAboutLateOrder } from '@/libs/notifications';
import {
  applyOrderAutoCancellation,
  isReadyWithoutCourierLate,
} from '@/libs/orderAutoCancellation';
import { Notification } from '@/models/notification';
import { Order } from '@/models/order';
import { User } from '@/models/user';

const LATE_ORDER_THRESHOLD_MINUTES = 120;
const activeStatuses = ['placed', 'processing', 'ready', 'transportation', 'delivered'];

const normalizeOrder = (order: any) => ({
  ...order,
  paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
  orderStatus: order.orderStatus || 'placed',
});

const getMinutesSince = (date: Date | string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 60000);

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: userEmail }).lean();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user.restaurantId) {
    return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
  }

  const orderDocuments = await Order.find({
    restaurantId: user.restaurantId,
    orderStatus: { $in: activeStatuses },
  })
    .populate('courierId', 'name email image')
    .sort({ createdAt: 1 });

  const orders = (
    await Promise.all(orderDocuments.map((order) => applyOrderAutoCancellation(order)))
  )
    .map(({ order }) => order.toObject())
    .filter((order) => activeStatuses.includes(order.orderStatus));

  const lateOrders = orders
    .map((order) => ({
      order,
      minutesSincePlaced: getMinutesSince(order.createdAt),
    }))
    .filter(
      ({ order, minutesSincePlaced }) =>
        !['transportation', 'delivered'].includes(order.orderStatus) &&
        (minutesSincePlaced >= LATE_ORDER_THRESHOLD_MINUTES || isReadyWithoutCourierLate(order))
    );

  await Promise.all(
    lateOrders.map(async ({ order, minutesSincePlaced }) => {
      const existingLateNotification = await Notification.findOne({
        orderId: order._id,
        type: 'late_order',
        'metadata.lateOrderAlert': isReadyWithoutCourierLate(order)
          ? 'ready_without_courier_15'
          : 'placement_to_transport_120',
      }).lean();

      if (existingLateNotification) {
        return;
      }

      await notifyRestaurantAdminsAboutLateOrder({
        restaurantId: user.restaurantId,
        orderId: order._id,
        minutesSincePlaced,
        reason: isReadyWithoutCourierLate(order)
          ? 'ready_without_courier'
          : 'late_before_transport',
      });
    })
  );

  return Response.json({
    orders: orders.map((order) => ({
      ...normalizeOrder(order),
      minutesSincePlaced: getMinutesSince(order.createdAt),
      isReadyWithoutCourierLate: isReadyWithoutCourierLate(order),
      isLateBeforeTransport: lateOrders.some(
        ({ order: lateOrder }) => lateOrder._id.toString() === order._id.toString()
      ),
    })),
    lateThresholdMinutes: LATE_ORDER_THRESHOLD_MINUTES,
  });
}
