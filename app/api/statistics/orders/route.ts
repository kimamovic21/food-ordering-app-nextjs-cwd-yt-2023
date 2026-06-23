import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/app/api/auth/[...nextauth]/route';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { buildDailyData, buildMonthlyData, summarizeOrders } from '@/libs/statistics';

export async function GET() {
  try {
    // Check if user is super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const [orders, restaurants] = await Promise.all([
      Order.find().sort({ createdAt: -1 }),
      Restaurant.find().select('_id name').lean(),
    ]);

    const orderSummary = summarizeOrders(orders, restaurants);
    const monthlyData = buildMonthlyData(orders, (order) => order.createdAt, 'orders');
    const dailyData = buildDailyData(orders, (order) => order.createdAt, 'orders');

    return NextResponse.json({
      ...orderSummary,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching orders statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch orders statistics' }, { status: 500 });
  }
}
