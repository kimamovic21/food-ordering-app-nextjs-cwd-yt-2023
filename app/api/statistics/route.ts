import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { MenuItem } from '@/models/menuItem';
import { Notification } from '@/models/notification';
import { Restaurant } from '@/models/restaurant';
import { SupportTicket } from '@/models/supportTicket';
import { User } from '@/models/user';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/app/api/auth/[...nextauth]/route';
import {
  buildDailyData,
  buildMonthlyData,
  summarizeOrders,
  summarizeUsers,
} from '@/libs/statistics';

export async function GET() {
  try {
    // Check if user is super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const [
      orders,
      users,
      restaurants,
      totalMenuItems,
      unavailableMenuItems,
      openSupportTickets,
      unreadNotifications,
    ] = await Promise.all([
      Order.find().sort({ createdAt: -1 }),
      User.find().sort({ createdAt: -1 }),
      Restaurant.find().select('_id name').lean(),
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ isAvailable: false }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_review'] } }),
      Notification.countDocuments({ isRead: false }),
    ]);

    const orderSummary = summarizeOrders(orders, restaurants);
    const userSummary = summarizeUsers(users);
    const monthlyData = buildMonthlyData(orders, (order) => order.createdAt, 'orders');
    const dailyData = buildDailyData(orders, (order) => order.createdAt, 'orders');

    return NextResponse.json({
      ...orderSummary,
      totalUsers: userSummary.totalUsers,
      totalRestaurants: restaurants.length,
      totalMenuItems,
      unavailableMenuItems,
      openSupportTickets,
      unreadNotifications,
      totalAdmins: userSummary.totalAdmins,
      totalCouriers: userSummary.totalCouriers,
      totalCustomers: userSummary.totalCustomers,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
