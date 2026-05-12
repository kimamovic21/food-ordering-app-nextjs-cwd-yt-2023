import mongoose from 'mongoose';
import { User } from '@/models/user';
import { hashAuthToken } from '@/libs/authEmails';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return Response.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const tokenHash = hashAuthToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return Response.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { emailVerifiedAt: new Date() },
        $unset: {
          emailVerificationTokenHash: '',
          emailVerificationTokenExpiresAt: '',
        },
      }
    );

    return Response.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
