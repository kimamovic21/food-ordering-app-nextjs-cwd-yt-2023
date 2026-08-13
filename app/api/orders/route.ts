import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import {
  notifyCourierAboutRestaurantHandoff,
  notifyFailedDeliveryCancellationVerified,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { createAuditLog } from '@/libs/auditLog';
import { getDevOrderTimeSimulatorOffsets } from '@/libs/devOrderTimeSimulatorStore';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { notifyWaitingUsersIfRestaurantCanAcceptOrders } from '@/libs/restaurantAvailabilityRequests';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';

const normalizeOrder = (order: any) => ({
  ...order,
  paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
  orderStatus: order.orderStatus || 'placed',
});

const getSuperAdminEmail = () =>
  process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

const isSuperAdminUser = (user: { email?: string | null }) =>
  Boolean(getSuperAdminEmail() && user.email === getSuperAdminEmail());

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

  const isSuperAdmin = isSuperAdminUser(user);

  if (!user.restaurantId && !isSuperAdmin) {
    return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
  }

  const url = new URL(request.url);

  const id = url.searchParams.get('id');

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findOne({
      _id: id,
      ...(isSuperAdmin ? {} : { restaurantId: user.restaurantId }),
    }).populate('courierId', 'name email image');

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const { order: normalizedDocument } = await applyOrderAutoCancellation(
      order,
      process.env.NODE_ENV === 'development' ? getDevOrderTimeSimulatorOffsets(id) : {}
    );

    await normalizedDocument.populate('courierId', 'name email image');

    return Response.json({ order: normalizeOrder(normalizedDocument.toObject()) });
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const listFilter = isSuperAdmin ? {} : { restaurantId: user.restaurantId };
  const totalOrders = await Order.countDocuments(listFilter);
  const orders = await Order.find(listFilter)
    .populate('courierId', 'name email image')
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);
  const normalizedOrders = (
    await Promise.all(orders.map((order) => applyOrderAutoCancellation(order)))
  ).map(({ order }) => normalizeOrder(order.toObject()));

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

  const isSuperAdmin = isSuperAdminUser(user);

  if (!user.restaurantId && !isSuperAdmin) {
    return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
  }

  const { id, orderStatus, action } = await request.json();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const allowedActions = ['handoff-to-courier', 'verify-failed-delivery'];
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

  const order = await Order.findOne({
    _id: id,
    ...(isSuperAdmin ? {} : { restaurantId: user.restaurantId }),
  });

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

    await notifyWaitingUsersIfRestaurantCanAcceptOrders(order.restaurantId);

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

  if (action === 'verify-failed-delivery') {
    if (order.orderStatus !== 'transportation') {
      return Response.json(
        { error: 'Only transported orders can be canceled as failed delivery' },
        { status: 400 }
      );
    }

    if (!order.failedDeliveryRequestedAt) {
      return Response.json(
        { error: 'Courier must request failed delivery cancellation first' },
        { status: 400 }
      );
    }

    const now = new Date();
    const verifiedBy = isSuperAdmin ? 'super_admin' : 'restaurant_owner';
    const courierId = order.courierId;

    (order as any).orderPaid = false;
    (order as any).paid = false;
    (order as any).paymentStatus = false;
    order.orderStatus = 'canceled';
    order.failedDeliveryVerifiedAt = now;
    order.failedDeliveryVerifiedBy = user._id;
    order.failedDeliveryVerifiedByRole = verifiedBy;
    order.canceledBy = verifiedBy;
    order.canceledAt = now;

    if (courierId) {
      const courier = await User.findById(courierId);
      if (courier?.takenOrder?.toString() === order._id.toString()) {
        courier.takenOrder = null;
        await courier.save();
      }
    }

    const savedOrder = await order.save();
    await notifyWaitingUsersIfRestaurantCanAcceptOrders(order.restaurantId);

    await createAuditLog({
      actor: user,
      action: 'order.failed_delivery_canceled',
      entityType: 'order',
      entityId: order._id,
      restaurantId: order.restaurantId,
      orderId: order._id,
      metadata: {
        canceledBy: verifiedBy,
        courierId: courierId?.toString() || null,
      },
    });

    if (order.userId && order.restaurantId) {
      try {
        await notifyFailedDeliveryCancellationVerified({
          userId: order.userId,
          courierId,
          restaurantId: order.restaurantId,
          orderId: order._id,
          verifiedBy,
        });
      } catch (notificationError) {
        console.error(
          'Failed to create failed delivery verification notification:',
          notificationError
        );
      }
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

  if (['completed', 'canceled'].includes(orderStatus)) {
    await notifyWaitingUsersIfRestaurantCanAcceptOrders(order.restaurantId);
  }

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
