import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { getCourierEarningsReport } from '@/libs/courierEarnings';
import { mongoConnect } from '@/libs/mongoConnect';
import { User } from '@/models/user';

const isSameId = (left: unknown, right: unknown) => String(left || '') === String(right || '');

export async function GET(request: Request) {
  await mongoConnect();

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requester = await User.findOne({ email: session.user.email });

  if (!requester) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedCourierId = url.searchParams.get('courierId');
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const isSuperAdmin =
    requester.role === 'admin' && Boolean(superAdminEmail && requester.email === superAdminEmail);
  const courierId = requestedCourierId || requester._id;

  if (!mongoose.Types.ObjectId.isValid(String(courierId))) {
    return Response.json({ error: 'Invalid courier ID' }, { status: 400 });
  }

  if (requestedCourierId && !isSuperAdmin && !isSameId(requester._id, requestedCourierId)) {
    return Response.json(
      { error: 'Only super admin can view other courier earnings' },
      { status: 403 }
    );
  }

  if (!requestedCourierId && requester.role !== 'courier') {
    return Response.json({ error: 'Only couriers can access their earnings' }, { status: 403 });
  }

  const courier = requestedCourierId ? await User.findById(requestedCourierId).lean() : requester;

  if (!courier || courier.role !== 'courier') {
    return Response.json({ error: 'Courier not found' }, { status: 404 });
  }

  const report = await getCourierEarningsReport(courier._id);

  return Response.json({
    courier: {
      _id: courier._id,
      name: courier.name,
      email: courier.email,
      image: courier.image || '',
      availability: Boolean(courier.availability),
      createdAt: courier.createdAt,
    },
    orders: report.orders,
    earningsChart: report.earningsChart,
    summary: report.summary,
  });
}
