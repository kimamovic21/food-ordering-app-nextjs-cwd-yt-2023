import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { notifyOrderDelivered } from '@/libs/notifications';
import { createDeliveryPin } from '@/libs/deliveryPin';
import mongoose from 'mongoose';

const normalizeOrder = (order: any) => {
  const { deliveryPin: _deliveryPin, ...safeOrder } = order;

  return {
    ...safeOrder,
    paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
    orderStatus: order.orderStatus || 'placed',
  };
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const user = await User.findOne({ email: userEmail });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only courier can access this' }, { status: 403 });
  }

  // Get orders assigned to this courier with transportation status
  const orders = await Order.find({
    courierId: user._id,
    orderStatus: 'transportation',
  });

  const normalizedOrders = await Promise.all(
    orders.map(async (order) => {
      if (!order.deliveryPin) {
        order.deliveryPin = createDeliveryPin();
        await order.save();
      }

      return normalizeOrder(order.toObject());
    })
  );

  return Response.json({ orders: normalizedOrders });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const user = await User.findOne({ email: userEmail });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only courier can update order status' }, { status: 403 });
  }

  const { orderId, deliveryPin } = await request.json();

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // Verify courier is assigned to this order
  if (order.courierId?.toString() !== user._id.toString()) {
    return Response.json({ error: 'You are not assigned to this order' }, { status: 403 });
  }

  // Verify order status is transportation
  if (order.orderStatus !== 'transportation') {
    return Response.json(
      { error: 'Order must be in transportation status to mark as delivered' },
      { status: 400 }
    );
  }

  if (!deliveryPin || String(deliveryPin).trim() !== String(order.deliveryPin || '').trim()) {
    return Response.json({ error: 'Invalid delivery PIN' }, { status: 400 });
  }

  // Courier confirms handoff. Customer or restaurant admin must finalize completion.
  order.orderStatus = 'delivered';
  order.courierId = user._id;
  order.courierDeliveredAt = new Date();

  // Clear courier's taken order
  user.takenOrder = null;

  await order.save();
  await user.save();

  if (order.userId && order.restaurantId) {
    try {
      await notifyOrderDelivered({
        userId: order.userId,
        courierId: user._id,
        restaurantId: order.restaurantId,
        orderId: order._id,
      });
    } catch (notificationError) {
      console.error('Failed to create order completion notification:', notificationError);
    }
  }

  return Response.json({ order: normalizeOrder(order.toObject()) });
}
