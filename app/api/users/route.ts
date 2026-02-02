import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const totalUsers = await User.countDocuments({});
  const users = await User.find(
    {},
    'name email image city country phone postalCode streetAddress role'
  )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalUsers / limit) || 1;

  return Response.json({ users, page, totalPages, totalUsers });
}
