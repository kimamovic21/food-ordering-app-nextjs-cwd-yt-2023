import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only couriers can access this' }, { status: 403 });
  }

  const { id } = await params;

  const order = await Order.findOne({
    _id: id,
    courierId: user._id,
    orderStatus: 'completed',
  }).lean();

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  return Response.json({ order });
}
