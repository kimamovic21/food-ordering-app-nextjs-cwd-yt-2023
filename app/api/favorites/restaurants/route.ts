import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import mongoose from 'mongoose';

const getAuthorizedUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await User.findOne({ email });
  return user;
};

const isRestaurantOpen = (
  workingHours: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed?: boolean;
  }> = [],
  blockedDates: Array<{ date: string | Date }> = [],
  targetDate: Date = new Date()
) => {
  const isBlocked = blockedDates.some((blocked) => {
    const blockedDate = new Date(blocked.date);

    if (Number.isNaN(blockedDate.getTime())) {
      return false;
    }

    return (
      blockedDate.getFullYear() === targetDate.getFullYear() &&
      blockedDate.getMonth() === targetDate.getMonth() &&
      blockedDate.getDate() === targetDate.getDate()
    );
  });

  if (isBlocked) {
    return false;
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[targetDate.getDay()];
  const todayHours = workingHours.find((hours) => hours.day === dayName);

  if (!todayHours || todayHours.isClosed) {
    return false;
  }

  const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);

  if (
    Number.isNaN(openHour) ||
    Number.isNaN(openMinute) ||
    Number.isNaN(closeHour) ||
    Number.isNaN(closeMinute)
  ) {
    return false;
  }

  const currentTime = targetDate.getHours() * 60 + targetDate.getMinutes();
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  return currentTime >= openTime && currentTime <= closeTime;
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getAuthorizedUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await Restaurant.find({
    _id: { $in: user.favoriteRestaurants || [] },
  })
    .select('name city country street description images workingHours blockedDates createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();

  const formattedRestaurants = restaurants.map((restaurant) => ({
    _id: restaurant._id,
    name: restaurant.name,
    city: restaurant.city,
    country: restaurant.country,
    street: restaurant.street,
    description: restaurant.description,
    image: Array.isArray(restaurant.images) ? restaurant.images[0] || null : null,
    isOpen: isRestaurantOpen(
      Array.isArray(restaurant.workingHours) ? restaurant.workingHours : [],
      Array.isArray(restaurant.blockedDates) ? restaurant.blockedDates : [],
      now
    ),
  }));

  return Response.json({ restaurants: formattedRestaurants });
}

export async function POST(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getAuthorizedUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const restaurantId = body?.restaurantId;

  if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
    return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const restaurant = await Restaurant.findById(restaurantId).select('_id ownerId');

  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const userId = user._id?.toString();
  const userRestaurantId = user.restaurantId?.toString();
  const ownerId = restaurant.ownerId?.toString();

  if (
    (userRestaurantId && userRestaurantId === restaurantId) ||
    (userId && ownerId && userId === ownerId)
  ) {
    return Response.json(
      { error: 'You cannot add your own restaurant to favorites' },
      { status: 403 }
    );
  }

  const existingFavorites = (user.favoriteRestaurants || []).map((id: mongoose.Types.ObjectId) =>
    id.toString()
  );
  const alreadyFavorite = existingFavorites.includes(restaurantId);

  if (alreadyFavorite) {
    await User.updateOne({ _id: user._id }, { $pull: { favoriteRestaurants: restaurantId } });
  } else {
    await User.updateOne({ _id: user._id }, { $addToSet: { favoriteRestaurants: restaurantId } });
  }

  return Response.json({
    success: true,
    isFavorite: !alreadyFavorite,
    action: alreadyFavorite ? 'removed' : 'added',
  });
}
