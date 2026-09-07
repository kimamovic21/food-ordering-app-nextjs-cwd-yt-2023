import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import { Restaurant } from '@/models/restaurant';
import cloudinary from '@/libs/cloudinary';
import { normalizePhoneNumberForStorage } from '@/libs/phone';
import { findBlockingRestaurantOrder } from '@/libs/orderDeletionGuards';
import mongoose from 'mongoose';
import type { ProfileUpdateData } from '@/types/user';

export async function PUT(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const data = await req.json();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedFields: (keyof ProfileUpdateData)[] = [
    'name',
    'phone',
    'streetAddress',
    'postalCode',
    'city',
    'country',
  ];

  const updateData: ProfileUpdateData = {};

  for (const key of allowedFields) {
    if (key in data) {
      updateData[key] = data[key];
    }
  }

  if ('phone' in data) {
    const rawPhone = String(data.phone ?? '').trim();

    if (rawPhone) {
      const normalizedPhone = normalizePhoneNumberForStorage(rawPhone);

      if (!normalizedPhone) {
        return Response.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
      }

      updateData.phone = normalizedPhone;
    } else {
      updateData.phone = '';
    }
  }

  await User.updateOne({ email }, { $set: updateData });

  const updatedUser = await User.findOne({ email });

  return Response.json(updatedUser);
}

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email });

  return Response.json(user);
}

export async function DELETE() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user to check if they have an image to delete
  const user = await User.findOne({ email });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete user's image from Cloudinary if it exists
  if (user.image && user.image !== '/user-default-image.webp') {
    try {
      const match = user.image.match(
        /\/(users(?:-production)?|restaurants(?:-production)?|menu-items(?:-production)?)\/([^/.]+)(?:\.[a-zA-Z0-9]+)?$/
      );

      if (match) {
        await cloudinary.uploader.destroy(`${match[1]}/${match[2]}`);
      }
    } catch (cloudinaryErr) {
      console.error('Cloudinary delete error:', cloudinaryErr);
      // Continue with user deletion even if image deletion fails
    }
  }

  const restaurant = await Restaurant.findOne({
    $or: [{ ownerId: user._id }, { _id: user.restaurantId }],
  });

  if (restaurant) {
    const activeOrder = await findBlockingRestaurantOrder(restaurant._id);
    if (activeOrder) {
      return Response.json(
        {
          error:
            'Your restaurant has active orders. Finish or cancel those orders before deleting your account.',
          activeOrderId: String(activeOrder._id),
          activeOrderStatus: activeOrder.orderStatus,
        },
        { status: 409 }
      );
    }

    const restaurantImages = Array.isArray(restaurant.images) ? restaurant.images : [];
    for (const imageUrl of restaurantImages) {
      const match =
        typeof imageUrl === 'string'
          ? imageUrl.match(/\/(restaurants(?:-production)?)\/([^/.]+)(?:\.[a-zA-Z0-9]+)?$/)
          : null;

      if (match) {
        try {
          await cloudinary.uploader.destroy(`${match[1]}/${match[2]}`);
        } catch (cloudinaryErr) {
          console.error('Cloudinary restaurant image delete error:', cloudinaryErr);
        }
      }
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
    for (const menuItem of menuItems) {
      const imageUrl = menuItem.image as string | undefined;
      const match =
        typeof imageUrl === 'string'
          ? imageUrl.match(/\/(menu-items(?:-production)?)\/([^/.]+)(?:\.[a-zA-Z0-9]+)?$/)
          : null;

      if (match) {
        try {
          await cloudinary.uploader.destroy(`${match[1]}/${match[2]}`);
        } catch (cloudinaryErr) {
          console.error('Cloudinary menu item image delete error:', cloudinaryErr);
        }
      }
    }

    await MenuItem.deleteMany({ restaurantId: restaurant._id });
    await Restaurant.deleteOne({ _id: restaurant._id });

    await User.updateMany(
      {},
      {
        $pull: {
          favoriteRestaurants: restaurant._id,
          favoriteMenuItems: { $in: menuItems.map((menuItem: any) => menuItem._id) },
        },
      }
    );
  }

  // Delete the user from the database
  // Orders remain intact as per requirements
  await User.deleteOne({ email });

  return Response.json({ success: true, message: 'Account deleted successfully' });
}
