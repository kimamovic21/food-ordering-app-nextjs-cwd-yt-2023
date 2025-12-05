import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function PUT(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const data = await req.json();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowedFields = ['name', 'phone', 'streetAddress', 'postalCode', 'city', 'country'];
  const updateData: any = {};
  for (const key of allowedFields) {
    if (key in data) updateData[key] = data[key];
  }

  await User.updateOne({ email }, { $set: updateData });

  const updatedUser = await User.findOne({ email });

  return Response.json(updatedUser);
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findOne({ email });
  return Response.json(user);
};