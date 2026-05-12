import { User } from '@/models/user';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import {
  generateAuthToken,
  hashAuthToken,
  isSkipVerifyEmail,
  sendVerificationEmail,
} from '@/libs/authEmails';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is not defined in environment variables!');
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const pass = body.password;

    if (!pass || pass.length < 5) {
      return Response.json({ error: 'Password must be at least 5 characters!' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(pass, salt);
    const skipVerification = isSkipVerifyEmail();
    const verificationToken = skipVerification ? null : generateAuthToken();

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const createdUser = await User.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      provider: 'credentials',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role,
      emailVerifiedAt: skipVerification ? new Date() : null,
      emailVerificationTokenHash: verificationToken ? hashAuthToken(verificationToken) : null,
      emailVerificationTokenExpiresAt: verificationToken
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null,
      availability: false,
      takenOrder: null,
      restaurantId: null,
    });

    if (verificationToken && process.env.RESEND_API_KEY) {
      await sendVerificationEmail({
        name: body.name,
        email: body.email,
        token: verificationToken,
      });
    }

    return Response.json(
      {
        ...createdUser,
        verificationRequired: !skipVerification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
