import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { createAuditLog } from '@/libs/auditLog';
import { buildCartItemsFromOrderProducts } from '@/libs/orderCartSnapshot';
import { Order } from '@/models/order';
import { User } from '@/models/user';

export async function POST(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const order = await Order.findOne({ _id: orderId, userId: user._id }).lean();
  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  let cartItems;

  try {
    cartItems = await buildCartItemsFromOrderProducts(order.cartProducts || []);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to reorder this order.' },
      { status: 400 }
    );
  }

  await createAuditLog({
    actor: user,
    action: 'order.reordered',
    entityType: 'order',
    entityId: order._id,
    restaurantId: cartItems[0]?.restaurantId,
    orderId: order._id,
    metadata: { itemCount: cartItems.length },
  });

  return Response.json({ cartItems });
}
