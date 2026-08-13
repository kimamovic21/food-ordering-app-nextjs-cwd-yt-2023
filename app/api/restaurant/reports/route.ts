import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import {
  buildRestaurantReportSummary,
  getRestaurantReportDateRange,
} from '@/libs/restaurantReports';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user || user.role !== 'admin' || !user.restaurantId) {
    return Response.json({ error: 'Restaurant admin access required' }, { status: 403 });
  }

  const restaurant = await Restaurant.findById(user.restaurantId).select('_id name').lean();
  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const range = getRestaurantReportDateRange(searchParams.get('period'), searchParams.get('date'));

  const orders = await Order.find({
    restaurantId: restaurant._id,
    createdAt: {
      $gte: range.start,
      $lte: range.end,
    },
  })
    .select(
      '_id orderStatus orderPaid paid total taxAmount deliveryFee couponDiscountAmount loyaltyDiscount cartProducts createdAt'
    )
    .lean();

  const report = buildRestaurantReportSummary({
    period: range.period,
    label: range.label,
    start: range.start,
    end: range.end,
    orders,
  });

  return Response.json({
    restaurant: {
      _id: restaurant._id?.toString?.() || String(restaurant._id),
      name: restaurant.name,
    },
    report,
  });
}
