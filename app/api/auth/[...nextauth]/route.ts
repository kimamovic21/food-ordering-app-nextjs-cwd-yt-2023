import NextAuth, { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export const isAdmin = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return false;
  }

  await mongoose.connect(process.env.MONGODB_URL as string);
  const user = await User.findOne({ email: userEmail });

  if (!user) {
    return false;
  }

  return user.role === 'admin';
};

export const isSuperAdmin = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  if (!userEmail || !superAdminEmail) {
    return false;
  }

  return userEmail === superAdminEmail;
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
