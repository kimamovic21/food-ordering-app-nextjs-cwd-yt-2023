import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { mongoConnect } from '@/libs/mongoConnect';
import { Order } from '@/models/order';
import { User } from '@/models/user';

const normalizeActiveOrder = (order: any) => ({
  _id: String(order._id || ''),
  orderStatus: order.orderStatus || 'placed',
  paymentStatus: Boolean(order.orderPaid || order.paymentStatus || order.paid),
  createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
  updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
  estimatedTotalMinutes:
    typeof order.estimatedTotalMinutes === 'number' ? order.estimatedTotalMinutes : null,
});

export async function GET() {
  await mongoConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const candidateOrders = await Order.find({
    userId: user._id,
    orderStatus: { $nin: ['completed', 'canceled'] },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  for (const candidateOrder of candidateOrders) {
    const { order } = await applyOrderAutoCancellation(candidateOrder);
    if (order.orderStatus !== 'completed' && order.orderStatus !== 'canceled') {
      return Response.json({ order: normalizeActiveOrder(order.toObject()) });
    }
  }

  return Response.json({ order: null });
}
