import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';

const getPaymentStatus = (order: any) =>
  Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    const now = new Date();

    const totalOrders = orders.length;
    const paidOrders = orders.filter((order) => getPaymentStatus(order)).length;
    const unpaidOrders = orders.filter((order) => !getPaymentStatus(order)).length;
    const totalIncome = orders
      .filter((order) => getPaymentStatus(order))
      .reduce((sum, order) => sum + order.total, 0);

    const ordersLast12Months = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const monthsAgo = new Date(now);
      monthsAgo.setMonth(monthsAgo.getMonth() - 12);
      return orderDate >= monthsAgo;
    });

    const ordersPerMonth: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      ordersPerMonth[monthKey] = 0;
    }

    ordersLast12Months.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      if (ordersPerMonth[monthKey] !== undefined) {
        ordersPerMonth[monthKey]++;
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthlyData = Object.entries(ordersPerMonth).map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      return {
        month: `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`,
        orders: count,
      };
    });

    const dailyOrdersMap: Record<string, number> = {};
    const ordersLast365Days = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const daysAgo = new Date(now);
      daysAgo.setDate(daysAgo.getDate() - 365);
      return orderDate >= daysAgo;
    });

    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      dailyOrdersMap[dayKey] = 0;
    }

    ordersLast365Days.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toISOString().split('T')[0];
      if (dailyOrdersMap[dayKey] !== undefined) {
        dailyOrdersMap[dayKey]++;
      }
    });

    const dailyData = Object.entries(dailyOrdersMap).map(([date, count]) => ({
      date,
      orders: count,
    }));

    return NextResponse.json({
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalIncome,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching orders statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch orders statistics' }, { status: 500 });
  }
}
