import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { sanitizeDevOrderTimeOffsets } from '@/libs/devOrderTimeSimulator';
import {
  clearDevOrderTimeSimulatorOffsets,
  getDevOrderTimeSimulatorOffsets,
  setDevOrderTimeSimulatorOffsets,
} from '@/libs/devOrderTimeSimulatorStore';
import { User } from '@/models/user';

const ensureDevelopmentUser = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return { error: Response.json({ error: 'Not found' }, { status: 404 }) };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await User.findOne({ email }).select('_id role').lean();

  if (!user || !['admin', 'courier'].includes(user.role)) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 403 }) };
  }

  return { user };
};

const getOrderIdFromRequest = (request: Request) => {
  const url = new URL(request.url);

  return url.searchParams.get('orderId') || '';
};

export async function GET(request: Request) {
  const auth = await ensureDevelopmentUser();
  if ('error' in auth) return auth.error;

  const orderId = getOrderIdFromRequest(request);
  if (!orderId) {
    return Response.json({ error: 'Missing orderId' }, { status: 400 });
  }

  return Response.json({ offsets: getDevOrderTimeSimulatorOffsets(orderId) });
}

export async function PATCH(request: Request) {
  const auth = await ensureDevelopmentUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '');

  if (!orderId) {
    return Response.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const offsets = setDevOrderTimeSimulatorOffsets(
    orderId,
    sanitizeDevOrderTimeOffsets(body?.offsets)
  );

  return Response.json({ success: true, offsets });
}

export async function DELETE(request: Request) {
  const auth = await ensureDevelopmentUser();
  if ('error' in auth) return auth.error;

  const orderId = getOrderIdFromRequest(request);
  if (!orderId) {
    return Response.json({ error: 'Missing orderId' }, { status: 400 });
  }

  clearDevOrderTimeSimulatorOffsets(orderId);

  return Response.json({ success: true });
}
