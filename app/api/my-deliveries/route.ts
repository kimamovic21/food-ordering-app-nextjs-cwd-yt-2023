import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { getCourierEarningsReport } from '@/libs/courierEarnings';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only couriers can access this' }, { status: 403 });
  }

  const report = await getCourierEarningsReport(user._id);

  return Response.json({
    orders: report.orders,
    earningsChart: report.earningsChart,
    summary: report.summary,
  });
}
