import { MenuItem } from '@/models/menuItem';
import { isAdmin } from '../auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const menuItemDoc = await MenuItem.create(data);

  return Response.json(menuItemDoc);
}

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const items = await MenuItem.find();
  return Response.json(items);
}

export async function PUT(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { _id, ...rest } = await req.json();
  await MenuItem.findByIdAndUpdate(_id, rest);

  return Response.json(true);
}

export async function DELETE(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const _id = searchParams.get('_id');

  if (_id) {
    await MenuItem.deleteOne({ _id });
  }

  return Response.json(true);
}
