import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import '@/models/category';
import '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
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

  const user = await User.findOne({ email });
  return user;
};

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const user = await getAuthorizedUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favoriteIdStrings = Array.isArray(user.favoriteMenuItems)
      ? user.favoriteMenuItems
          .map((id: unknown) => normalizeObjectIdString(id))
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      : [];

    if (favoriteIdStrings.length === 0) {
      return Response.json({ items: [] });
    }

    const favoriteIds = favoriteIdStrings.map((id: string) => new mongoose.Types.ObjectId(id));

    let items = await MenuItem.find({
      _id: { $in: favoriteIds },
    })
      .populate('category', 'name')
      .populate('restaurantId', 'name city country')
      .sort({ createdAt: -1 });

    // Fallback: some legacy datasets can behave inconsistently with ObjectId matching.
    // Match by string representation of _id to avoid returning false-empty results.
    if (items.length === 0 && favoriteIdStrings.length > 0) {
      const fallbackItems = await MenuItem.aggregate([
        {
          $addFields: {
            idString: { $toString: '$_id' },
          },
        },
        {
          $match: {
            idString: { $in: favoriteIdStrings },
          },
        },
        {
          $project: {
            idString: 0,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      const fallbackIds = fallbackItems
        .map((item) => normalizeObjectIdString(item?._id))
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));

      if (fallbackIds.length > 0) {
        items = await MenuItem.find({ _id: { $in: fallbackIds } })
          .populate('category', 'name')
          .populate('restaurantId', 'name city country')
          .sort({ createdAt: -1 });
      }
    }

    return Response.json({ items });
  } catch (error) {
    console.error('Failed to fetch favorite menu items:', error);
    return Response.json({ error: 'Failed to fetch favorite meals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const userId = normalizeObjectIdString(user._id);
    const userRestaurantId = normalizeObjectIdString(user.restaurantId);
    const itemAdminId = normalizeObjectIdString(menuItem.adminId);
    const itemRestaurantId = normalizeObjectIdString(menuItem.restaurantId);

    if (
      (userId && itemAdminId && userId === itemAdminId) ||
      (userRestaurantId && itemRestaurantId && userRestaurantId === itemRestaurantId)
    ) {
      return Response.json(
        { error: 'You cannot add your own created meal to favorites' },
        { status: 403 }
      );
    }

    const existingFavorites = Array.isArray(user.favoriteMenuItems)
      ? user.favoriteMenuItems
          .map((id: unknown) => normalizeObjectIdString(id))
          .filter((id: string) => id.length > 0)
      : [];
    const alreadyFavorite = existingFavorites.includes(menuItemId);

    await User.updateOne(
      {
        _id: user._id,
        $or: [
          { favoriteMenuItems: { $exists: false } },
          { favoriteMenuItems: null },
          { favoriteMenuItems: { $not: { $type: 'array' } } },
        ],
      },
      { $set: { favoriteMenuItems: [] } }
    );

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
  } catch (error) {
    console.error('Failed to update favorite menu items:', error);
    return Response.json({ error: 'Failed to update favorite meals' }, { status: 500 });
  }
}
