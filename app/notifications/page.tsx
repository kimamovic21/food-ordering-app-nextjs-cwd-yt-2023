import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import { createPageMetadata } from '@/libs/metadata';
import NotificationsCenter from '@/components/shared/NotificationsCenter';

export const metadata = createPageMetadata({
  title: 'Notifications',
  description: 'View order and delivery notifications for your account.',
  path: '/notifications',
  noIndex: true,
});

const NotificationsPage = async () => {
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
  const backHref = role === 'admin' ? '/admin-dashboard' : '/my-orders';
  const backLabel = role === 'admin' ? 'Back to dashboard' : 'Back to orders';

  return (
    <NotificationsCenter
      title='Notifications'
      description='Track order updates, delivery changes, and courier assignments in one place.'
      backHref={backHref}
      backLabel={backLabel}
      role={role}
    />
  );
};

export default NotificationsPage;
