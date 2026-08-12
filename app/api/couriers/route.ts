import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import { notifyCourierAboutAssignment } from '@/libs/notifications';
import { COURIER_OWN_ORDER_ASSIGNMENT_ERROR, isCourierOrderOwner } from '@/libs/courierAssignment';
import { isCourierScheduledNow } from '@/libs/courierSchedule';
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
    // Only get couriers who don't have a taken order
    filter.takenOrder = null;
  }

  const couriers = await User.find(filter).select(
    'name email image availability courierWorkingHours takenOrder role createdAt'
  );
  const scheduledCouriers = availableOnly
    ? couriers.filter((courier: any) => isCourierScheduledNow(courier.courierWorkingHours))
    : couriers;

  return Response.json({ couriers: scheduledCouriers });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courierId, orderId, courierAssignmentNote } = await request.json();
  const assignmentNote =
    typeof courierAssignmentNote === 'string' ? courierAssignmentNote.trim().slice(0, 300) : '';

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

  // Check if courier already has a taken order
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

  // Order must be in 'ready' status to assign a courier
  if (order.orderStatus !== 'ready') {
    return Response.json(
      { error: 'Order must be in ready status before assigning a courier' },
      { status: 400 }
    );
  }

  if (isCourierOrderOwner(order.userId, courier._id)) {
    return Response.json({ error: COURIER_OWN_ORDER_ASSIGNMENT_ERROR }, { status: 400 });
  }

  // Update courier's taken order
  courier.takenOrder = orderId;
  await courier.save();

  // Update order with courier and change status to transportation
  order.courierId = courierId;
  order.courierAssignmentStatus = 'pending';
  order.courierAssignmentNote = assignmentNote;
  order.courierAssignedAt = new Date();
  order.courierAcceptedAt = null;
  order.courierDeclinedAt = null;
  order.restaurantHandedToCourierAt = null;
  order.courierPickedUpAt = null;
  if (!order.deliveryPin) {
    order.deliveryPin = createDeliveryPin();
  }
  await order.save();

  try {
    await notifyCourierAboutAssignment({
      courierId,
      orderId: order._id,
    });
  } catch (notificationError) {
    console.error('Failed to create courier assignment notifications:', notificationError);
  }

  return Response.json({ courier, order });
}
