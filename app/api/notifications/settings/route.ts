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

  return User.findOne({ email }).select('_id notificationSoundEnabled');
};

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    notificationSoundEnabled: Boolean(user.notificationSoundEnabled),
  });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const notificationSoundEnabled = Boolean(body?.notificationSoundEnabled);

  user.notificationSoundEnabled = notificationSoundEnabled;
  await user.save();

  return Response.json({
    success: true,
    notificationSoundEnabled,
  });
}
