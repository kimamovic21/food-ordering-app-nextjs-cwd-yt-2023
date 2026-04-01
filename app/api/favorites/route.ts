import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

const getAuthorizedUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await User.findOne({ email }).select('favoriteMenuItems favoriteRestaurants').lean();
  return user;
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getAuthorizedUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favoriteMenuItemIds = Array.isArray(user.favoriteMenuItems)
    ? user.favoriteMenuItems.map((id: mongoose.Types.ObjectId) => id.toString())
    : [];

  const favoriteRestaurantIds = Array.isArray(user.favoriteRestaurants)
    ? user.favoriteRestaurants.map((id: mongoose.Types.ObjectId) => id.toString())
    : [];

  return Response.json({ favoriteMenuItemIds, favoriteRestaurantIds });
}
