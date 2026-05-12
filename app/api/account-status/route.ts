import mongoose from 'mongoose';
import { User } from '@/models/user';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({ found: false, canResetPassword: false });
    }

    return Response.json({
      found: true,
      provider: user.provider || 'credentials',
      emailVerified: Boolean(user.emailVerifiedAt),
      canResetPassword: user.provider === 'credentials' && Boolean(user.password),
    });
  } catch (error) {
    console.error('ACCOUNT STATUS ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
