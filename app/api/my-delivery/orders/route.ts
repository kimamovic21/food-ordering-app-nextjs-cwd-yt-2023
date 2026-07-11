import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import {
  notifyOrderDelivered,
  notifyRestaurantAdminsAboutFailedDeliveryRequest,
  notifyRestaurantAdminsAboutCourierAssignmentUpdate,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { createDeliveryPin } from '@/libs/deliveryPin';
import mongoose from 'mongoose';

const FAILED_DELIVERY_MIN_TRANSPORT_MINUTES = 30;

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

  const orders = await Order.find({
    courierId: user._id,
    orderStatus: { $in: ['ready', 'transportation'] },
    $or: [
      { courierAssignmentStatus: { $in: ['pending', 'accepted'] } },
      { orderStatus: 'transportation', courierAssignmentStatus: null },
      { orderStatus: 'transportation', courierAssignmentStatus: { $exists: false } },
    ],
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

  const requestBody = await request.json();
  const { orderId, deliveryPin, action } = requestBody;

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

  if (action === 'accept-assignment') {
    if (order.courierAssignmentStatus !== 'pending') {
      return Response.json({ error: 'This assignment is not pending' }, { status: 400 });
    }

    order.courierAssignmentStatus = 'accepted';
    order.courierAcceptedAt = new Date();
    await order.save();

    if (order.restaurantId) {
      try {
        await notifyRestaurantAdminsAboutCourierAssignmentUpdate({
          restaurantId: order.restaurantId,
          orderId: order._id,
          courierName: user.name,
          status: 'accepted',
        });
      } catch (notificationError) {
        console.error('Failed to create courier accepted notification:', notificationError);
      }
    }

    return Response.json({ order: normalizeOrder(order.toObject()) });
  }

  if (action === 'decline-assignment') {
    if (!['pending', 'accepted'].includes(order.courierAssignmentStatus || '')) {
      return Response.json({ error: 'This assignment cannot be declined' }, { status: 400 });
    }

    order.courierAssignmentStatus = 'declined';
    order.courierDeclinedBy = user._id;
    order.courierDeclinedAt = new Date();
    order.courierId = null;
    user.takenOrder = null;

    await order.save();
    await user.save();

    if (order.restaurantId) {
      try {
        await notifyRestaurantAdminsAboutCourierAssignmentUpdate({
          restaurantId: order.restaurantId,
          orderId: order._id,
          courierName: user.name,
          status: 'declined',
        });
      } catch (notificationError) {
        console.error('Failed to create courier declined notification:', notificationError);
      }
    }

    return Response.json({ order: normalizeOrder(order.toObject()) });
  }

  if (action === 'pick-up') {
    if (order.courierAssignmentStatus !== 'accepted') {
      return Response.json({ error: 'Accept this assignment before pickup' }, { status: 400 });
    }

    if (!order.restaurantHandedToCourierAt) {
      return Response.json(
        { error: 'Restaurant must hand this order to you before pickup' },
        { status: 400 }
      );
    }

    const now = new Date();
    order.orderStatus = 'transportation';
    order.courierPickedUpAt = now;
    order.transportationAt = now;

    await order.save();

    try {
      if (order.restaurantId) {
        await notifyRestaurantAdminsAboutCourierAssignmentUpdate({
          restaurantId: order.restaurantId,
          orderId: order._id,
          courierName: user.name,
          status: 'picked_up',
        });
      }

      if (order.userId) {
        await notifyUserAboutOrderStatusChange({
          userId: order.userId,
          orderId: order._id,
          orderStatus: 'transportation',
          estimatedMinutes: order.estimatedDeliveryMinutes,
        });
      }
    } catch (notificationError) {
      console.error('Failed to create pickup notification:', notificationError);
    }

    return Response.json({ order: normalizeOrder(order.toObject()) });
  }

  if (action === 'request-failed-delivery') {
    if (order.orderStatus !== 'transportation') {
      return Response.json(
        { error: 'Order must be in transportation before reporting customer unavailable' },
        { status: 400 }
      );
    }

    if (order.failedDeliveryRequestedAt) {
      return Response.json(
        { error: 'Failed delivery cancellation is already waiting for admin verification' },
        { status: 400 }
      );
    }

    const transportStartedAt = order.transportationAt || order.courierPickedUpAt;
    if (!transportStartedAt) {
      return Response.json(
        { error: 'Delivery transport start time is missing for this order' },
        { status: 400 }
      );
    }

    const now = new Date();
    const transportMinutes = Math.floor(
      (now.getTime() - new Date(transportStartedAt).getTime()) / 60000
    );

    if (transportMinutes < FAILED_DELIVERY_MIN_TRANSPORT_MINUTES) {
      return Response.json(
        {
          error: `You can request failed delivery cancellation after ${FAILED_DELIVERY_MIN_TRANSPORT_MINUTES} minutes in transport.`,
          remainingMinutes: FAILED_DELIVERY_MIN_TRANSPORT_MINUTES - transportMinutes,
        },
        { status: 400 }
      );
    }

    const reason =
      typeof requestBody?.reason === 'string' ? requestBody.reason.trim().slice(0, 300) : '';

    order.failedDeliveryRequestedAt = now;
    order.failedDeliveryRequestedBy = user._id;
    order.failedDeliveryReason = reason;
    await order.save();

    if (order.restaurantId) {
      try {
        await notifyRestaurantAdminsAboutFailedDeliveryRequest({
          restaurantId: order.restaurantId,
          orderId: order._id,
          courierName: user.name,
          reason,
        });
      } catch (notificationError) {
        console.error('Failed to create failed delivery request notification:', notificationError);
      }
    }

    return Response.json({ order: normalizeOrder(order.toObject()) });
  }

  if (order.orderStatus !== 'transportation') {
    return Response.json(
      { error: 'Order must be in transportation status to mark as delivered' },
      { status: 400 }
    );
  }

  if (order.failedDeliveryRequestedAt) {
    return Response.json(
      { error: 'Failed delivery cancellation is waiting for admin verification' },
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
