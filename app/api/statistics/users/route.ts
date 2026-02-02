import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';

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

    const users = await User.find().sort({ createdAt: -1 });
    const now = new Date();

    const totalUsers = users.length;

    const usersLast12Months = users.filter((user) => {
      const createdAt = new Date(user.createdAt);
      const monthsAgo = new Date(now);
      monthsAgo.setMonth(monthsAgo.getMonth() - 12);
      return createdAt >= monthsAgo;
    });

    const usersPerMonth: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      usersPerMonth[monthKey] = 0;
    }

    usersLast12Months.forEach((user) => {
      const createdAt = new Date(user.createdAt);
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      if (usersPerMonth[monthKey] !== undefined) {
        usersPerMonth[monthKey]++;
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
    const monthlyData = Object.entries(usersPerMonth).map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      return {
        month: `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`,
        users: count,
      };
    });

    const dailyUsersMap: Record<string, number> = {};
    const usersLast365Days = users.filter((user) => {
      const createdAt = new Date(user.createdAt);
      const daysAgo = new Date(now);
      daysAgo.setDate(daysAgo.getDate() - 365);
      return createdAt >= daysAgo;
    });

    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      dailyUsersMap[dayKey] = 0;
    }

    usersLast365Days.forEach((user) => {
      const createdAt = new Date(user.createdAt);
      const dayKey = createdAt.toISOString().split('T')[0];
      if (dailyUsersMap[dayKey] !== undefined) {
        dailyUsersMap[dayKey]++;
      }
    });

    const dailyData = Object.entries(dailyUsersMap).map(([date, count]) => ({
      date,
      users: count,
    }));

    return NextResponse.json({
      totalUsers,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching users statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch users statistics' }, { status: 500 });
  }
}
