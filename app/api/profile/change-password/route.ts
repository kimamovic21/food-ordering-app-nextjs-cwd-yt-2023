import * as z from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { strongPasswordSchema } from '@/libs/password';
import { User } from '@/models/user';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required.' })
      .max(64, { message: 'Current password must be 64 characters or fewer.' }),
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

export async function PUT(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = changePasswordSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      {
        error: parsedBody.error.issues[0]?.message || 'Invalid password change request.',
      },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.password || !bcrypt.compareSync(parsedBody.data.currentPassword, user.password)) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(parsedBody.data.newPassword, salt);

  await User.updateOne({ email }, { $set: { password: hashedPassword } });

  return Response.json({ success: true, message: 'Password updated successfully' });
}
