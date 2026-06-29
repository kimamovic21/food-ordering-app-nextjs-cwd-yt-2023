import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import {
  notifyCourierAboutRestaurantHandoff,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { createAuditLog } from '@/libs/auditLog';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';

const normalizeOrder = (order: any) => ({
  ...order,
  paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
  orderStatus: order.orderStatus || 'placed',
});

export async function GET(request: Request) {
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

  const url = new URL(request.url);

  const id = url.searchParams.get('id');

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, restaurantId: user.restaurantId })
      .populate('courierId', 'name email image')
      .lean();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json({ order: normalizeOrder(order) });
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const totalOrders = await Order.countDocuments({ restaurantId: user.restaurantId });
  const orders = await Order.find({ restaurantId: user.restaurantId })
    .populate('courierId', 'name email image')
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const normalizedOrders = orders.map(normalizeOrder);

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  return Response.json({ orders: normalizedOrders, page, totalPages, totalOrders });
}

export async function PATCH(request: Request) {
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

  const { id, orderStatus, action } = await request.json();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const allowedActions = ['handoff-to-courier'];
  if (action && !allowedActions.includes(action)) {
    return Response.json({ error: 'Invalid order action' }, { status: 400 });
  }

  const allowedStatuses = [
    'placed',
    'processing',
    'ready',
    'transportation',
    'delivered',
    'completed',
  ];
  if (!action && !allowedStatuses.includes(orderStatus)) {
    return Response.json({ error: 'Invalid order status' }, { status: 400 });
  }

  if (!action && orderStatus === 'delivered') {
    return Response.json(
      { error: 'Courier must mark the order as delivered with the delivery PIN' },
      { status: 400 }
    );
  }

  if (!action && orderStatus === 'transportation') {
    return Response.json(
      { error: 'Order automatically moves to transportation when courier is assigned' },
      { status: 400 }
    );
  }

  const order = await Order.findOne({ _id: id, restaurantId: user.restaurantId });

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const previousStatus = order.orderStatus;

  const hasPaid = Boolean(
    (order as any).orderPaid ?? (order as any).paymentStatus ?? (order as any).paid
  );

  if (previousStatus === 'canceled') {
    return Response.json({ error: 'Canceled orders cannot be updated' }, { status: 400 });
  }

  if (!hasPaid) {
    return Response.json(
      { error: 'Cannot update status before payment is completed' },
      { status: 400 }
    );
  }

  if (action === 'handoff-to-courier') {
    if (order.orderStatus !== 'ready') {
      return Response.json(
        { error: 'Order must be ready before courier handoff' },
        { status: 400 }
      );
    }

    if (!order.courierId || order.courierAssignmentStatus !== 'accepted') {
      return Response.json(
        { error: 'Courier must accept the assignment before handoff' },
        { status: 400 }
      );
    }

    order.restaurantHandedToCourierAt = new Date();
    const savedOrder = await order.save();

    await createAuditLog({
      actor: user,
      action: 'order.handed_to_courier',
      entityType: 'order',
      entityId: order._id,
      restaurantId: order.restaurantId,
      orderId: order._id,
      metadata: { courierId: order.courierId.toString() },
    });

    try {
      await notifyCourierAboutRestaurantHandoff({
        courierId: order.courierId,
        orderId: order._id,
      });
    } catch (notificationError) {
      console.error('Failed to create courier handoff notification:', notificationError);
    }

    return Response.json({ order: normalizeOrder(savedOrder.toObject()) });
  }

  if (orderStatus === 'completed' && previousStatus !== 'delivered') {
    return Response.json(
      { error: 'Order can be completed only after courier marks it as delivered' },
      { status: 400 }
    );
  }

  const now = new Date();

  (order as any).orderPaid = hasPaid;
  order.orderStatus = orderStatus;

  if (orderStatus === 'processing' && !order.processingAt) {
    order.processingAt = now;
  }
  if (orderStatus === 'ready' && !order.readyAt) {
    order.readyAt = now;
  }
  if (orderStatus === 'completed') {
    order.adminConfirmedDeliveryAt = now;
    order.deliveryCompletedBy = 'admin';
    order.completedAt = now;
  }

  const savedOrder = await order.save();

  if (previousStatus !== orderStatus) {
    await createAuditLog({
      actor: user,
      action: 'order.status_updated',
      entityType: 'order',
      entityId: order._id,
      restaurantId: order.restaurantId,
      orderId: order._id,
      metadata: { previousStatus, orderStatus },
    });
  }

  if (previousStatus !== orderStatus && order.userId) {
    try {
      await notifyUserAboutOrderStatusChange({
        userId: order.userId,
        orderId: order._id,
        orderStatus,
        estimatedMinutes:
          orderStatus === 'processing'
            ? order.estimatedPreparationMinutes
            : orderStatus === 'ready'
              ? order.estimatedDeliveryMinutes
              : null,
      });
    } catch (notificationError) {
      console.error('Failed to create order status notification:', notificationError);
    }
  }

  return Response.json({ order: normalizeOrder(savedOrder.toObject()) });
}
