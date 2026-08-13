import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { Restaurant } from '@/models/restaurant';
import { RestaurantAvailabilityRequest } from '@/models/restaurantAvailabilityRequest';
import { User } from '@/models/user';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json(
      { error: 'Please sign in to request this notification.' },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const [user, restaurant] = await Promise.all([
    User.findOne({ email: session.user.email }),
    Restaurant.findById(id),
  ]);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const isOwnRestaurant =
    restaurant.ownerId?.toString() === user._id.toString() ||
    user.restaurantId?.toString() === restaurant._id.toString();

  if (isOwnRestaurant) {
    return Response.json(
      { error: 'You cannot request availability alerts for your own restaurant.' },
      { status: 403 }
    );
  }

  const orderingStatus = getRestaurantOrderingStatus({ restaurant });
  if (orderingStatus.isAcceptingOrders) {
    return Response.json({
      success: true,
      alreadyAvailable: true,
      message: `${restaurant.name} is already accepting orders.`,
    });
  }

  const existingRequest = await RestaurantAvailabilityRequest.findOne({
    userId: user._id,
    restaurantId: restaurant._id,
    status: 'waiting',
  }).lean();

  if (existingRequest) {
    return Response.json({
      success: true,
      alreadyRequested: true,
      message: `You will be notified when ${restaurant.name} is accepting orders again.`,
    });
  }

  await RestaurantAvailabilityRequest.create({
    userId: user._id,
    restaurantId: restaurant._id,
    status: 'waiting',
  });

  return Response.json({
    success: true,
    message: `You will be notified when ${restaurant.name} is accepting orders again.`,
  });
}
