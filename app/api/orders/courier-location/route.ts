import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user information
  const userEmail = session.user.email;
  const user = await User.findOne({ email: userEmail });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    // Find the order and populate courier information
    const order = await Order.findById(orderId).populate('courierId').lean();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization: only admin or the customer who placed the order can access
    if (user.role !== 'admin' && order.email !== userEmail) {
      return Response.json({ error: 'Not authorized to view this order' }, { status: 403 });
    }

    // Check if order has a courier assigned
    let courier: any = order.courierId;

    // Fallback: if no courierId on the order, try to find a courier currently holding this order
    if (!courier) {
      courier = await User.findOne({ takenOrder: order._id });
    }

    if (!courier) {
      return Response.json({ location: null, message: 'No courier assigned to this order' });
    }

    return Response.json({
      location: {
        latitude: courier.latitude ?? null,
        longitude: courier.longitude ?? null,
        lastLocationUpdate: courier.lastLocationUpdate ?? null,
      },
      courier: {
        name: courier.name,
        email: courier.email,
      },
    });
  } catch (error) {
    console.error('Error fetching courier location:', error);
    return Response.json({ error: 'Failed to fetch courier location' }, { status: 500 });
  }
}
