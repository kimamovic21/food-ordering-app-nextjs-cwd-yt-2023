import mongoose from 'mongoose';
import { User } from '@/models/user';
import { generateAuthToken, hashAuthToken, sendPasswordResetEmail } from '@/libs/authEmails';
import {
  createRateLimitKey,
  createRateLimitResponse,
  enforceRateLimit,
  getClientIp,
} from '@/libs/rateLimit';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const rateLimit = await enforceRateLimit({
      identifier: createRateLimitKey('forgot-password', getClientIp(req), email),
      limit: 5,
      namespace: 'auth-forgot-password',
      window: '15 m',
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        'Too many password reset requests. Please try again later.'
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({
        success: true,
        message: 'If the account exists, a password reset email will be sent.',
      });
    }

    if (user.provider !== 'credentials' || !user.password) {
      return Response.json({
        success: false,
        canResetPassword: false,
        message:
          'If you used Google sign-in, you cannot reset a password. Use the Google button on the login page instead.',
      });
    }

    const token = generateAuthToken();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: hashAuthToken(token),
          passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }
    );

    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      token,
    });

    return Response.json({ success: true, message: 'Password reset email sent.' });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
