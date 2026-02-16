import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can access statistics' }, { status: 403 });
    }

    if (!user.restaurantId) {
      return NextResponse.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
    }

    const restaurantId = user.restaurantId;

    // Fetch all orders for this restaurant
    const orders = await Order.find({ restaurantId }).lean();

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => order.orderStatus === 'completed').length;
    const unsuccessfulOrders = totalOrders - completedOrders;
    const totalIncome = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Count unique users who ordered
    const uniqueUserIds = new Set();
    orders.forEach((order) => {
      if (order.userId) {
        uniqueUserIds.add(order.userId.toString());
      }
    });
    const totalUniqueUsers = uniqueUserIds.size;

    return NextResponse.json(
      {
        statistics: {
          totalUniqueUsers,
          totalOrders,
          completedOrders,
          unsuccessfulOrders,
          totalIncome: Math.round(totalIncome * 100) / 100, // Round to 2 decimal places
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
