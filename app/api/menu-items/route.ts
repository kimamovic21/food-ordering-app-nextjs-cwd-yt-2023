import '@/models/category';
import { MenuItem } from '@/models/menuItem';
import { isAdmin } from '../auth/[...nextauth]/route';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.priceSmall || !data.priceMedium || !data.priceLarge) {
      console.error('Missing prices:', { priceSmall: data.priceSmall, priceMedium: data.priceMedium, priceLarge: data.priceLarge });
      return Response.json({ error: 'All prices are required' }, { status: 400 });
    }

    const menuItemData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      priceSmall: Number(data.priceSmall),
      priceMedium: Number(data.priceMedium),
      priceLarge: Number(data.priceLarge),
    };

    const menuItemDoc = await MenuItem.create(menuItemData);

    return Response.json(menuItemDoc);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return Response.json({ error: 'Failed to create menu item', details: error }, { status: 500 });
  }
}

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const items = await MenuItem
    .find()
    .populate('category');
  return Response.json(items);
}

export async function PUT(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { _id, ...data } = await req.json();

    if (!data.priceSmall || !data.priceMedium || !data.priceLarge) {
      console.error('Missing prices:', { priceSmall: data.priceSmall, priceMedium: data.priceMedium, priceLarge: data.priceLarge });
      return Response.json({ error: 'All prices are required' }, { status: 400 });
    }

    const updateData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      priceSmall: Number(data.priceSmall),
      priceMedium: Number(data.priceMedium),
      priceLarge: Number(data.priceLarge),
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
