import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { createAuditLog } from '@/libs/auditLog';
import { buildCartItemsFromOrderProducts } from '@/libs/orderCartSnapshot';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: restaurantId } = await params;
  if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
    return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const [user, restaurant] = await Promise.all([
    User.findOne({ email: session.user.email }),
    Restaurant.findById(restaurantId).select('_id name').lean(),
  ]);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const order = await Order.findOne({
    userId: user._id,
    restaurantId,
    cartProducts: { $exists: true, $ne: [] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!order) {
    return Response.json(
      { error: `You do not have a previous order from ${restaurant.name} yet.` },
      { status: 404 }
    );
  }

  let cartItems;

  try {
    cartItems = await buildCartItemsFromOrderProducts(order.cartProducts || []);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to reorder this restaurant.' },
      { status: 400 }
    );
  }

  await createAuditLog({
    actor: user,
    action: 'restaurant.quick_reordered',
    entityType: 'restaurant',
    entityId: restaurant._id,
    restaurantId: restaurant._id,
    orderId: order._id,
    metadata: {
      itemCount: cartItems.length,
      sourceOrderId: order._id,
    },
  });

  return Response.json({
    cartItems,
    restaurantName: restaurant.name,
    sourceOrderId: order._id?.toString?.() || String(order._id),
  });
}
