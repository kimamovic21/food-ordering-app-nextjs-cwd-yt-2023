import * as z from 'zod';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '@/models/user';
import { strongPasswordSchema } from '@/libs/password';
import { hashAuthToken } from '@/libs/authEmails';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: 'Reset token is required.' }),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z
      .string()
      .min(1, { message: 'Please confirm your new password.' })
      .max(64, { message: 'Password confirmation must be 64 characters or fewer.' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmNewPassword'],
      });
    }
  });

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const body = await req.json();
    const parsedBody = resetPasswordSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        {
          error: parsedBody.error.issues[0]?.message || 'Invalid password reset request.',
        },
        { status: 400 }
      );
    }

    const tokenHash = hashAuthToken(parsedBody.data.token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return Response.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (user.provider !== 'credentials' || !user.password) {
      return Response.json(
        { error: 'This account uses Google sign-in and cannot reset a password.' },
        { status: 400 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(parsedBody.data.newPassword, salt);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetTokenExpiresAt: '',
        },
      }
    );

    return Response.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
