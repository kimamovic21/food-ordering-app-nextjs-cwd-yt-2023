import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { AuditLog } from '@/models/auditLog';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

const serializeAuditLog = (log: any) => ({
  _id: log._id?.toString?.() || String(log._id || ''),
  actorEmail: log.actorEmail || '',
  actorRole: log.actorRole || '',
  action: log.action || '',
  entityType: log.entityType || '',
  entityId: log.entityId || '',
  restaurantId: log.restaurantId?.toString?.() || null,
  orderId: log.orderId?.toString?.() || null,
  metadata: log.metadata || {},
  createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
});

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuperAdmin = Boolean(SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL);
  let query: Record<string, unknown> = {};

  if (!isSuperAdmin) {
    const restaurant = user.restaurantId
      ? await Restaurant.findById(user.restaurantId).select('_id').lean()
      : await Restaurant.findOne({ ownerId: user._id }).select('_id').lean();

    if (!restaurant) {
      return Response.json(
        { error: 'Create a restaurant before viewing audit logs' },
        { status: 403 }
      );
    }

    query = { restaurantId: restaurant._id };
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(5, Number(url.searchParams.get('limit') || 20)));
  const skip = (page - 1) * limit;

  const [logs, totalLogs] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return Response.json({
    logs: logs.map(serializeAuditLog),
    page,
    totalPages: Math.ceil(totalLogs / limit) || 1,
    totalLogs,
  });
}
