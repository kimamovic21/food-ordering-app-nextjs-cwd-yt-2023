import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  mongoose.connect(process.env.MONGODB_URL as string);

  const { name } = await request.json();

  const categoryDocument = await Category.create({ name });

  return new Response(categoryDocument);
}

export async function PUT(request: Request) {
  mongoose.connect(process.env.MONGODB_URL as string);

  const { _id, name } = await request.json();

  const categoryDocument = await Category.findByIdAndUpdate(_id, { name }, { new: true });

  return new Response(JSON.stringify(categoryDocument));
}

export async function DELETE(request: Request) {
  mongoose.connect(process.env.MONGODB_URL as string);

  const { _id } = await request.json();

  const menuItems = await MenuItem.find({ category: _id });

  for (const menuItem of menuItems) {
    if (menuItem.image) {
      try {
        const publicId = menuItem.image.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error('Error deleting image from cloudinary:', error);
      }
    }
  }

  await MenuItem.deleteMany({ category: _id });

  const categoryDocument = await Category.findByIdAndDelete(_id);

  return new Response(JSON.stringify(categoryDocument));
}

export async function GET() {
  mongoose.connect(process.env.MONGODB_URL as string);

  const categories = await Category.find().sort({ name: 1 });

  return new Response(JSON.stringify(categories));
}
