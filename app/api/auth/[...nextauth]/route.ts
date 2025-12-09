import NextAuth, { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';

export const isAdmin = async () => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return false;
  };

  const user = await User.findOne({ email: userEmail });

  if (!user) {
    return false;
  };

  return user.admin;
};

const handler = NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};