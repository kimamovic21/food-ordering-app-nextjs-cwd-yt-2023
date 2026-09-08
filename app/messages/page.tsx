import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { createPageMetadata } from '@/libs/metadata';
import { User } from '@/models/user';
import MessagesCenter from '@/components/shared/MessagesCenter';

export const metadata = createPageMetadata({
  title: 'Messages',
  description: 'Direct conversations between customers, couriers, admins, and restaurant owners.',
  path: '/messages',
  noIndex: true,
});

const MessagesPage = async () => {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  const email = session?.user?.email;
  if (!email) {
    redirect('/login');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    redirect('/login');
  }

  const role = user.role === 'admin' ? 'admin' : user.role === 'courier' ? 'courier' : 'user';
  const backHref =
    role === 'admin'
      ? '/admin-dashboard'
      : role === 'courier'
        ? '/courier-dashboard'
        : '/my-orders';
  const backLabel =
    role === 'admin'
      ? 'Back to dashboard'
      : role === 'courier'
        ? 'Back to courier dashboard'
        : 'Back to orders';

  return (
    <MessagesCenter
      title='Messages'
      description='Keep approved conversations connected across customers, couriers, admins, and restaurant owners.'
      backHref={backHref}
      backLabel={backLabel}
    />
  );
};

export default MessagesPage;
