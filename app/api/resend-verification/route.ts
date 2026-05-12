import mongoose from 'mongoose';
import { User } from '@/models/user';
import {
  generateAuthToken,
  hashAuthToken,
  isSkipVerifyEmail,
  sendVerificationEmail,
} from '@/libs/authEmails';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    if (isSkipVerifyEmail()) {
      return Response.json({
        success: true,
        message: 'Email verification is skipped in this environment.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({
        success: true,
        message: 'If the account exists, a verification email will be sent.',
      });
    }

    if (user.provider !== 'credentials') {
      return Response.json({
        success: true,
        message: 'This account uses Google sign-in, so email verification is not required.',
      });
    }

    if (user.emailVerifiedAt) {
      return Response.json({ success: true, message: 'This email address is already verified.' });
    }

    const token = generateAuthToken();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationTokenHash: hashAuthToken(token),
          emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    );

    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      token,
    });

    return Response.json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    console.error('RESEND VERIFICATION ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
