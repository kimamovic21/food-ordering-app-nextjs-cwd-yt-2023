import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await User.find(
    {},
    'name email image city country phone postalCode streetAddress admin'
  ).sort({ createdAt: -1 });

  return Response.json(users);
}