import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import {
  notifyCourierAboutAssignment,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { COURIER_OWN_ORDER_ASSIGNMENT_ERROR, isCourierOrderOwner } from '@/libs/courierAssignment';
import { createDeliveryPin } from '@/libs/deliveryPin';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const availableOnly = url.searchParams.get('availableOnly') === 'true';

  const filter: any = { role: 'courier' };
  if (availableOnly) {
    filter.availability = true;
    filter.takenOrder = null;
  }

  const couriers = await User.find(filter).select(
    'name email image availability takenOrder role createdAt'
  );

  return Response.json({ couriers });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courierId, orderId } = await request.json();

  if (!courierId || !mongoose.Types.ObjectId.isValid(courierId)) {
    return Response.json({ error: 'Invalid courier ID' }, { status: 400 });
  }

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const courier = await User.findById(courierId);

  if (!courier) {
    return Response.json({ error: 'Courier not found' }, { status: 404 });
  }

  if (courier.role !== 'courier') {
    return Response.json({ error: 'User is not a courier' }, { status: 400 });
  }

  if (courier.takenOrder) {
    return Response.json(
      {
        error:
          'This courier is currently delivering another order. Please wait for them to finish the delivery before assigning a new order.',
      },
      { status: 400 }
    );
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.orderStatus !== 'ready') {
    return Response.json(
      { error: 'Order must be in ready status before assigning a courier' },
      { status: 400 }
    );
  }

  if (isCourierOrderOwner(order.userId, courier._id)) {
    return Response.json({ error: COURIER_OWN_ORDER_ASSIGNMENT_ERROR }, { status: 400 });
  }

  courier.takenOrder = orderId;
  await courier.save();

  order.courierId = courierId;
  order.orderStatus = 'transportation';
  order.transportationAt = new Date();
  if (!order.deliveryPin) {
    order.deliveryPin = createDeliveryPin();
  }
  await order.save();

  try {
    await notifyCourierAboutAssignment({
      courierId,
      orderId: order._id,
    });

    if (order.userId) {
      await notifyUserAboutOrderStatusChange({
        userId: order.userId,
        orderId: order._id,
        orderStatus: 'transportation',
      });
    }
  } catch (notificationError) {
    console.error('Failed to create courier assignment notifications:', notificationError);
  }

  return Response.json({ courier, order });
}
