import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
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

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getAuthorizedUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await MenuItem.find({
    _id: { $in: user.favoriteMenuItems || [] },
  })
    .populate('category', 'name')
    .populate('restaurantId', 'name city country')
    .sort({ createdAt: -1 });

  return Response.json({ items });
}

export async function POST(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getAuthorizedUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const menuItemId = body?.menuItemId;

  if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
    return Response.json({ error: 'Invalid menu item ID' }, { status: 400 });
  }

  const menuItem = await MenuItem.findById(menuItemId).select('_id adminId restaurantId');

  if (!menuItem) {
    return Response.json({ error: 'Menu item not found' }, { status: 404 });
  }

  const userId = user._id?.toString();
  const userRestaurantId = user.restaurantId?.toString();
  const itemAdminId = menuItem.adminId?.toString();
  const itemRestaurantId = menuItem.restaurantId?.toString();

  if (
    (userId && itemAdminId && userId === itemAdminId) ||
    (userRestaurantId && itemRestaurantId && userRestaurantId === itemRestaurantId)
  ) {
    return Response.json(
      { error: 'You cannot add your own created meal to favorites' },
      { status: 403 }
    );
  }

  const existingFavorites = (user.favoriteMenuItems || []).map((id: mongoose.Types.ObjectId) =>
    id.toString()
  );
  const alreadyFavorite = existingFavorites.includes(menuItemId);

  if (alreadyFavorite) {
    await User.updateOne({ _id: user._id }, { $pull: { favoriteMenuItems: menuItemId } });
  } else {
    await User.updateOne({ _id: user._id }, { $addToSet: { favoriteMenuItems: menuItemId } });
  }

  return Response.json({
    success: true,
    isFavorite: !alreadyFavorite,
    action: alreadyFavorite ? 'removed' : 'added',
  });
}
