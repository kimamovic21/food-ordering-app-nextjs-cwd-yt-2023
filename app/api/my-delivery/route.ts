import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import { CourierReview } from '@/models/courierReview';
import { Restaurant } from '@/models/restaurant';
import { notifyCourierAboutAssignment } from '@/libs/notifications';
import { COURIER_OWN_ORDER_ASSIGNMENT_ERROR, isCourierOrderOwner } from '@/libs/courierAssignment';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { isCourierScheduledNow } from '@/libs/courierSchedule';
import { createDeliveryPin } from '@/libs/deliveryPin';
import { scheduleCourierAssignmentTimeoutCheck } from '@/libs/qstash';
import mongoose from 'mongoose';

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceKm = (
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(endLatitude - startLatitude);
  const lonDelta = toRadians(endLongitude - startLongitude);
  const startLat = toRadians(startLatitude);
  const endLat = toRadians(endLatitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const availableOnly = url.searchParams.get('availableOnly') === 'true';
  const orderId = url.searchParams.get('orderId');

  const filter: any = { role: 'courier' };
  if (availableOnly) {
    filter.availability = true;
    filter.takenOrder = null;
  }

  const couriers = await User.find(filter)
    .select(
      'name email image availability courierWorkingHours takenOrder role createdAt latitude longitude'
    )
    .lean();
  const scheduledCouriers = availableOnly
    ? couriers.filter((courier: any) => isCourierScheduledNow(courier.courierWorkingHours))
    : couriers;

  let restaurant: any = null;
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const order = await Order.findById(orderId).select('restaurantId').lean();
    if (order?.restaurantId) {
      restaurant = await Restaurant.findById(order.restaurantId)
        .select('latitude longitude')
        .lean();
    }
  }

  const ratingSummary = await CourierReview.aggregate([
    { $match: { courierId: { $in: scheduledCouriers.map((courier) => courier._id) } } },
    {
      $group: {
        _id: '$courierId',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);
  const ratingMap = new Map(
    ratingSummary.map((item) => [
      item._id.toString(),
      {
        averageRating: Number(item.averageRating || 0),
        ratingCount: Number(item.ratingCount || 0),
      },
    ])
  );

  const scoredCouriers = scheduledCouriers
    .map((courier: any) => {
      const rating = ratingMap.get(courier._id.toString());
      const hasDistance =
        restaurant &&
        typeof restaurant.latitude === 'number' &&
        typeof restaurant.longitude === 'number' &&
        typeof courier.latitude === 'number' &&
        typeof courier.longitude === 'number';

      return {
        ...courier,
        distanceToRestaurantKm: hasDistance
          ? Number(
              calculateDistanceKm(
                courier.latitude,
                courier.longitude,
                restaurant.latitude,
                restaurant.longitude
              ).toFixed(2)
            )
          : null,
        averageRating: rating?.averageRating ?? 0,
        ratingCount: rating?.ratingCount ?? 0,
        isWithinSchedule: isCourierScheduledNow(courier.courierWorkingHours),
      };
    })
    .sort((left: any, right: any) => {
      if (left.availability !== right.availability) return left.availability ? -1 : 1;
      if (Boolean(left.takenOrder) !== Boolean(right.takenOrder)) return left.takenOrder ? 1 : -1;
      if (left.distanceToRestaurantKm !== null && right.distanceToRestaurantKm !== null) {
        return left.distanceToRestaurantKm - right.distanceToRestaurantKm;
      }
      return right.averageRating - left.averageRating;
    });

  return Response.json({ couriers: scoredCouriers });
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

  const order = await Order.findById(orderId);

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  await applyCourierAssignmentTimeout(order);

  if (order.orderStatus !== 'ready') {
    return Response.json(
      { error: 'Order must be in ready status before assigning a courier' },
      { status: 400 }
    );
  }

  if (order.courierId && ['pending', 'accepted'].includes(order.courierAssignmentStatus || '')) {
    return Response.json(
      {
        error:
          'This order already has an active courier assignment. Wait for the courier response or choose another courier after the assignment expires.',
      },
      { status: 400 }
    );
  }

  const courierTakenOrderId = courier.takenOrder?.toString?.() || '';

  if (courierTakenOrderId && courierTakenOrderId !== order._id.toString()) {
    return Response.json(
      {
        error:
          'This courier is currently delivering another order. Please wait for them to finish the delivery before assigning a new order.',
      },
      { status: 400 }
    );
  }

  if (isCourierOrderOwner(order.userId, courier._id)) {
    return Response.json({ error: COURIER_OWN_ORDER_ASSIGNMENT_ERROR }, { status: 400 });
  }

  courier.takenOrder = orderId;
  await courier.save();

  order.courierId = courierId;
  order.courierAssignmentStatus = 'pending';
  order.courierAssignmentNote = assignmentNote;
  order.courierAssignedAt = new Date();
  order.courierAcceptedAt = null;
  order.courierAssignmentExpiredAt = null;
  order.courierAssignmentExpiredCourierId = null;
  order.courierDeclinedBy = null;
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

  await scheduleCourierAssignmentTimeoutCheck(order._id);

  return Response.json({ courier, order });
}
