import '@/models/category';
import { MenuItem } from '@/models/menuItem';
import { User } from '@/models/user';
import { isAdmin } from '../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import mongoose from 'mongoose';
import cloudinary from '@/libs/cloudinary';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's ID and restaurantId
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'User session not found' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a restaurant
    if (!currentUser.restaurantId) {
      return Response.json(
        { error: 'You must have a restaurant to create menu items' },
        { status: 403 }
      );
    }

    const data = await req.json();

    // At least one price must be provided
    const hasAnyPrice = data.priceSmall || data.priceMedium || data.priceLarge;
    if (!hasAnyPrice) {
      return Response.json({ error: 'At least one price is required' }, { status: 400 });
    }

    if (!data.foodType || !['food', 'drink'].includes(data.foodType)) {
      return Response.json(
        { error: 'Invalid food type. Must be "food" or "drink"' },
        { status: 400 }
      );
    }

    // Validate image URL if provided
    if (data.image && typeof data.image === 'string') {
      if (!data.image.startsWith('http')) {
        return Response.json(
          { error: 'Invalid image URL. Must be a valid HTTP(S) URL' },
          { status: 400 }
        );
      }
    }

    const menuItemData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      foodType: data.foodType,
      priceSmall: data.priceSmall ? Number(data.priceSmall) : null,
      priceMedium: data.priceMedium ? Number(data.priceMedium) : null,
      priceLarge: data.priceLarge ? Number(data.priceLarge) : null,
      adminId: currentUser._id,
      restaurantId: currentUser.restaurantId,
    };

    const menuItemDoc = await MenuItem.create(menuItemData);

    return Response.json(menuItemDoc);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return Response.json({ error: 'Failed to create menu item', details: error }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const { searchParams } = new URL(req.url);
  const _id = searchParams.get('_id');
  const adminId = searchParams.get('adminId');

  if (_id) {
    const item = await MenuItem.findById(_id).populate('category');
    return Response.json(item ? [item] : []);
  }

  // If adminId is provided, filter by that admin
  if (adminId) {
    const items = await MenuItem.find({ adminId }).populate('category');
    return Response.json(items);
  }

  const items = await MenuItem.find().populate('category');
  return Response.json(items);
}

export async function PUT(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { _id, ...data } = await req.json();

    // At least one price must be provided
    const hasAnyPrice = data.priceSmall || data.priceMedium || data.priceLarge;
    if (!hasAnyPrice) {
      return Response.json({ error: 'At least one price is required' }, { status: 400 });
    }

    if (!data.foodType || !['food', 'drink'].includes(data.foodType)) {
      return Response.json(
        { error: 'Invalid food type. Must be "food" or "drink"' },
        { status: 400 }
      );
    }

    // Validate image URL if provided
    if (data.image && typeof data.image === 'string') {
      if (!data.image.startsWith('http')) {
        return Response.json(
          { error: 'Invalid image URL. Must be a valid HTTP(S) URL' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      foodType: data.foodType,
      priceSmall: data.priceSmall ? Number(data.priceSmall) : null,
      priceMedium: data.priceMedium ? Number(data.priceMedium) : null,
      priceLarge: data.priceLarge ? Number(data.priceLarge) : null,
    };

    const updated = await MenuItem.findByIdAndUpdate(_id, updateData, { new: true });

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return Response.json({ error: 'Failed to update menu item', details: error }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const _id = searchParams.get('_id');

  if (_id) {
    const menuItem = await MenuItem.findById(_id);

    if (menuItem && menuItem.image) {
      const matches = menuItem.image.match(/menu-items\/([^\.]+)/);
      const publicId = matches ? `menu-items/${matches[1]}` : null;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await MenuItem.deleteOne({ _id });
  }

  return Response.json(true);
}
