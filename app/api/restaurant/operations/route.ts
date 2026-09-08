import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { isCourierScheduledNow } from '@/libs/courierSchedule';
import { mongoConnect } from '@/libs/mongoConnect';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { getRestaurantOperationsDateRange } from '@/libs/restaurantOperationsDateRange';
import {
  buildRestaurantOperationsOverview,
  OPERATIONS_ACTIVE_STATUSES,
} from '@/libs/restaurantOperations';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

type OperationsAdminUser = {
  _id: unknown;
  role?: string | null;
  restaurantId?: unknown;
};

type OperationsCourier = {
  availability?: boolean | null;
  takenOrder?: unknown;
  courierWorkingHours?: unknown;
};

const findAdminRestaurant = async (user: OperationsAdminUser) => {
  if (user.restaurantId) {
    const restaurant = await Restaurant.findOne({
      $or: [{ _id: user.restaurantId }, { ownerId: user._id }],
    }).lean();

    if (restaurant) {
      return restaurant;
    }
  }

  return Restaurant.findOne({ ownerId: user._id }).lean();
};

export async function GET() {
  await mongoConnect();

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: userEmail }).lean();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurant = await findAdminRestaurant(user);

  if (!restaurant) {
    return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
  }

  const activeOrderDocuments = await Order.find({
    restaurantId: restaurant._id,
    orderStatus: { $in: OPERATIONS_ACTIVE_STATUSES },
  }).sort({ createdAt: 1 });

  const activeOrders = (
    await Promise.all(
      activeOrderDocuments.map(async (order) => {
        const { order: timeoutNormalizedOrder } = await applyCourierAssignmentTimeout(order);

        return applyOrderAutoCancellation(timeoutNormalizedOrder);
      })
    )
  )
    .map(({ order }) => order.toObject())
    .filter((order) => OPERATIONS_ACTIVE_STATUSES.includes(order.orderStatus));

  const todayRange = getRestaurantOperationsDateRange();
  const [todayOrders, couriers] = await Promise.all([
    Order.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: todayRange.start, $lte: todayRange.end },
    }).lean(),
    User.find({ role: 'courier' }).select('availability takenOrder courierWorkingHours').lean(),
  ]);
  const availableCouriers = couriers.filter(
    (courier: OperationsCourier) =>
      courier.availability &&
      !courier.takenOrder &&
      isCourierScheduledNow(courier.courierWorkingHours)
  ).length;

  return Response.json({
    operations: buildRestaurantOperationsOverview({
      restaurant,
      todayOrders,
      activeOrders,
      availableCouriers,
      totalCouriers: couriers.length,
      orderingStatus: getRestaurantOrderingStatus({ restaurant }),
      todayLabel: todayRange.label,
    }),
  });
}
