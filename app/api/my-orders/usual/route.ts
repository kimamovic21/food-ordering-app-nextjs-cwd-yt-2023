import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { buildCartItemsFromOrderProducts, createOrderPatternKey } from '@/libs/orderCartSnapshot';
import { Order } from '@/models/order';
import { User } from '@/models/user';

const isPaidOrderQuery = {
  $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const orders = await Order.find({
    userId: user._id,
    orderStatus: 'completed',
    ...isPaidOrderQuery,
  })
    .sort({ completedAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const patterns = new Map<
    string,
    {
      count: number;
      order: any;
      lastOrderedAt: Date;
    }
  >();

  orders.forEach((order: any) => {
    if (!Array.isArray(order.cartProducts) || order.cartProducts.length === 0) {
      return;
    }

    const restaurantIds = new Set(
      order.cartProducts.map(
        (item: any) =>
          item.restaurantId?.toString?.() || String(item.restaurantId || order.restaurantId || '')
      )
    );

    if (restaurantIds.size > 1) {
      return;
    }

    const key = createOrderPatternKey(order);
    const lastOrderedAt = new Date(order.completedAt || order.updatedAt || order.createdAt);
    const existing = patterns.get(key);

    if (!existing) {
      patterns.set(key, { count: 1, order, lastOrderedAt });
      return;
    }

    existing.count += 1;
    if (lastOrderedAt > existing.lastOrderedAt) {
      existing.order = order;
      existing.lastOrderedAt = lastOrderedAt;
    }
  });

  const usualPattern = Array.from(patterns.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return right.lastOrderedAt.getTime() - left.lastOrderedAt.getTime();
  })[0];

  if (!usualPattern) {
    return Response.json({ usualOrder: null });
  }

  try {
    const cartItems = await buildCartItemsFromOrderProducts(usualPattern.order.cartProducts || []);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return Response.json({
      usualOrder: {
        orderId: usualPattern.order._id,
        repeatCount: usualPattern.count,
        lastOrderedAt: usualPattern.lastOrderedAt,
        restaurantId: cartItems[0]?.restaurantId || null,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Number(subtotal.toFixed(2)),
        items: cartItems.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
        })),
        cartItems,
      },
    });
  } catch (error) {
    return Response.json(
      {
        usualOrder: null,
        error:
          error instanceof Error
            ? error.message
            : 'Your usual order cannot be rebuilt from current menu data.',
      },
      { status: 200 }
    );
  }
}
