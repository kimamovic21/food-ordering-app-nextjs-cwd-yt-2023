import { Order } from '@/models/order';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import { Restaurant } from '@/models/restaurant';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import mongoose from 'mongoose';

const normalizeOrder = (order: any) => ({
  ...order,
  paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
  orderStatus: order.orderStatus || 'pending',
  courier:
    order.courierId && typeof order.courierId === 'object'
      ? {
          _id: String(order.courierId._id || ''),
          name: order.courierId.name || '',
          email: order.courierId.email || '',
          image: order.courierId.image || null,
        }
      : null,
});

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const sessionId = url.searchParams.get('sessionId');

  // Find the current user
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (sessionId) {
    const order = await Order.findOne({ userId: user._id, stripeSessionId: sessionId })
      .populate('courierId', 'name email image')
      .lean();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const productIds = (order.cartProducts || [])
      .map((item: any) => String(item.productId))
      .filter((productId: string) => mongoose.Types.ObjectId.isValid(productId))
      .map((productId: string) => new mongoose.Types.ObjectId(productId));

    const menuItems = await MenuItem.find({ _id: { $in: productIds } })
      .select('_id image')
      .lean();
    const imageMap = new Map(menuItems.map((item) => [item._id.toString(), item.image]));

    const receiptItems = (order.cartProducts || []).map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;

      return {
        ...item,
        quantity,
        price,
        image: imageMap.get(String(item.productId)) || null,
        lineTotal: price * quantity,
      };
    });

    const restaurant = await Restaurant.findById(order.restaurantId)
      .select('name contact email street city postalCode country')
      .lean();

    return Response.json({
      order: normalizeOrder(order),
      receiptItems,
      restaurant: restaurant
        ? {
            _id: String(restaurant._id),
            name: restaurant.name,
            contact: restaurant.contact || null,
            email: restaurant.email || null,
            street: restaurant.street || null,
            city: restaurant.city || null,
            postalCode: restaurant.postalCode || null,
            country: restaurant.country || null,
          }
        : null,
    });
  }

  // If fetching specific order by id
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findById(id).populate('courierId', 'name email image').lean();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order belongs to current user
    if (order.userId?.toString() !== user._id.toString()) {
      return Response.json(
        { error: 'Unauthorized - Order does not belong to you' },
        { status: 403 }
      );
    }

    return Response.json({ order: normalizeOrder(order) });
  }

  // Fetch all orders for the current user
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const totalOrders = await Order.countDocuments({ userId: user._id });
  const orders = await Order.find({ userId: user._id })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const normalizedOrders = orders.map(normalizeOrder);

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  return Response.json({ orders: normalizedOrders, page, totalPages, totalOrders });
}
