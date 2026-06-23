import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import { buildDailyData, buildMonthlyData, summarizeUsers } from '@/libs/statistics';

export async function GET() {
  try {
    // Check if user is super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const users = await User.find().sort({ createdAt: -1 });
    const userSummary = summarizeUsers(users);
    const monthlyData = buildMonthlyData(users, (user) => user.createdAt, 'users');
    const dailyData = buildDailyData(users, (user) => user.createdAt, 'users');

    return NextResponse.json({
      ...userSummary,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching users statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch users statistics' }, { status: 500 });
  }
}
