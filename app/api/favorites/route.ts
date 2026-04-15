import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

const normalizeObjectIdString = (value: unknown): string => {
  if (!value) return '';
  if (
    typeof value === 'object' &&
    value !== null &&
    '$oid' in (value as Record<string, unknown>)
  ) {
    return String((value as Record<string, unknown>).$oid || '');
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)._id || '');
  }
  return String(value);
};

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
    ? user.favoriteMenuItems
        .map((id: unknown) => normalizeObjectIdString(id))
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
    : [];

  const favoriteRestaurantIds = Array.isArray(user.favoriteRestaurants)
    ? user.favoriteRestaurants
        .map((id: unknown) => normalizeObjectIdString(id))
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
    : [];

  return Response.json({ favoriteMenuItemIds, favoriteRestaurantIds });
}
