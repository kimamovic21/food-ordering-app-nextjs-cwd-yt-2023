import 'server-only';
import type { Types } from 'mongoose';
import { notifyUsersAboutRestaurantAvailable } from '@/libs/notifications';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { RestaurantAvailabilityRequest } from '@/models/restaurantAvailabilityRequest';

export const notifyWaitingUsersIfRestaurantAcceptingOrders = async ({
  restaurantId,
  restaurantName,
  isAcceptingOrders,
}: {
  restaurantId: string | Types.ObjectId;
  restaurantName: string;
  isAcceptingOrders: boolean;
}) => {
  if (!isAcceptingOrders || !restaurantId) {
    return;
  }

  const waitingRequests = await RestaurantAvailabilityRequest.find({
    restaurantId,
    status: 'waiting',
  }).select('_id userId');

  if (waitingRequests.length === 0) {
    return;
  }

  await notifyUsersAboutRestaurantAvailable({
    userIds: waitingRequests.map((request) => request.userId),
    restaurantId,
    restaurantName,
  });

  await RestaurantAvailabilityRequest.updateMany(
    { _id: { $in: waitingRequests.map((request) => request._id) } },
    { $set: { status: 'notified', notifiedAt: new Date() } }
  );
};

export const notifyWaitingUsersIfRestaurantCanAcceptOrders = async (restaurantId: unknown) => {
  if (!restaurantId) return;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return;

  const activeKitchenOrders = await Order.countDocuments({
    restaurantId: restaurant._id,
    orderStatus: { $in: ['placed', 'processing', 'ready'] },
    $or: [{ orderPaid: true }, { paid: true }],
  });

  const orderingStatus = getRestaurantOrderingStatus({
    restaurant,
  });
  const activeOrderLimit = Math.min(100, Math.max(1, Number(restaurant.activeOrderLimit) || 10));
  const hasCapacity = activeKitchenOrders < activeOrderLimit;

  await notifyWaitingUsersIfRestaurantAcceptingOrders({
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    isAcceptingOrders: orderingStatus.isAcceptingOrders && hasCapacity,
  });
};
