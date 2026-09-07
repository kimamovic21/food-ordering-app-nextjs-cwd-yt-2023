import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { mongoConnect } from '@/libs/mongoConnect';
import { notifyWaitingUsersIfRestaurantAcceptingOrders } from '@/libs/restaurantAvailabilityRequests';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await mongoConnect();

  const { id } = await context.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const restaurant = await Restaurant.findById(id)
    .select('name workingHours blockedDates deliveryRadiusKm isPaused pauseReason activeOrderLimit')
    .lean();

  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const orderingStatus = getRestaurantOrderingStatus({ restaurant });
  const activeOrderLimit = Math.min(
    100,
    Math.max(1, Number((restaurant as any).activeOrderLimit) || 10)
  );
  const activeKitchenOrders = await Order.countDocuments({
    restaurantId: restaurant._id,
    orderStatus: { $in: ['placed', 'processing', 'ready'] },
    $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
  });
  const isBusy = activeKitchenOrders >= activeOrderLimit;
  const reason = isBusy
    ? 'This restaurant is very busy at the moment. Please wait a little bit and try again.'
    : orderingStatus.reason;
  const isAcceptingOrders = orderingStatus.isAcceptingOrders && !isBusy;

  await notifyWaitingUsersIfRestaurantAcceptingOrders({
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    isAcceptingOrders,
  });

  return Response.json({
    restaurantId: String(restaurant._id),
    restaurantName: restaurant.name,
    isOpen: orderingStatus.isOpen,
    isPaused: orderingStatus.isPaused,
    isBusy,
    isAcceptingOrders,
    reason,
  });
}
