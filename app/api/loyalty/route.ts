import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { calculateLoyaltyStatus } from '@/libs/loyaltyCalculator';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count completed orders for the user
    const completedOrderCount = await Order.countDocuments({
      userId: user._id,
      orderStatus: 'completed',
    });

    const loyaltyStatus = calculateLoyaltyStatus(completedOrderCount);

    return NextResponse.json({
      discountPercentage: loyaltyStatus.discountPercentage,
      currentTier: loyaltyStatus.currentTier?.name || null,
      totalOrders: loyaltyStatus.totalOrders,
    });
  } catch (error) {
    console.error('Error fetching loyalty discount:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty discount' }, { status: 500 });
  }
}
