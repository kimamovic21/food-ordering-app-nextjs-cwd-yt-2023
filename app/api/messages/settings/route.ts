import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return User.findOne({ email }).select('_id messageSoundEnabled');
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    messageSoundEnabled: Boolean(user.messageSoundEnabled),
  });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messageSoundEnabled = Boolean(body?.messageSoundEnabled);

  user.messageSoundEnabled = messageSoundEnabled;
  await user.save();

  return Response.json({
    success: true,
    messageSoundEnabled,
  });
}
