import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: userEmail }).lean();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user.restaurantId) {
    return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
  }

  const activeOrdersCount = await Order.countDocuments({
    restaurantId: user.restaurantId,
    orderStatus: { $nin: ['completed', 'canceled'] },
  });

  return Response.json({ activeOrdersCount });
}
