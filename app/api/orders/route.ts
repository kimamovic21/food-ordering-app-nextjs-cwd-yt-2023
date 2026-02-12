import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';

const normalizeOrder = (order: any) => ({
  ...order,
  paymentStatus: Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid),
  orderStatus: order.orderStatus || 'placed',
});

export async function GET(request: Request) {
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

  const url = new URL(request.url);

  const id = url.searchParams.get('id');

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, restaurantId: user.restaurantId })
      .populate('courierId', 'name email image')
      .lean();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json({ order: normalizeOrder(order) });
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const totalOrders = await Order.countDocuments({ restaurantId: user.restaurantId });
  const orders = await Order.find({ restaurantId: user.restaurantId })
    .populate('courierId', 'name email image')
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const normalizedOrders = orders.map(normalizeOrder);

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  return Response.json({ orders: normalizedOrders, page, totalPages, totalOrders });
}

export async function PATCH(request: Request) {
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

  const { id, orderStatus } = await request.json();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const allowedStatuses = ['placed', 'processing', 'ready', 'transportation', 'completed'];
  if (!allowedStatuses.includes(orderStatus)) {
    return Response.json({ error: 'Invalid order status' }, { status: 400 });
  }

  // Admin cannot mark order as completed or transportation
  if (orderStatus === 'completed') {
    return Response.json({ error: 'Only courier can mark order as completed' }, { status: 400 });
  }

  if (orderStatus === 'transportation') {
    return Response.json(
      { error: 'Order automatically moves to transportation when courier is assigned' },
      { status: 400 }
    );
  }

  const order = await Order.findOne({ _id: id, restaurantId: user.restaurantId });

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const hasPaid = Boolean(
    (order as any).orderPaid ?? (order as any).paymentStatus ?? (order as any).paid
  );

  if (!hasPaid) {
    return Response.json(
      { error: 'Cannot update status before payment is completed' },
      { status: 400 }
    );
  }

  (order as any).orderPaid = hasPaid;
  order.orderStatus = orderStatus;
  const savedOrder = await order.save();

  return Response.json({ order: normalizeOrder(savedOrder.toObject()) });
}
