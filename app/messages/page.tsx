import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { createPageMetadata } from '@/libs/metadata';
import MessagesCenter from '@/components/shared/MessagesCenter';

export const metadata = createPageMetadata({
  title: 'Messages',
  description: 'Direct conversations between customers, couriers, admins, and restaurant owners.',
  path: '/messages',
  noIndex: true,
});

const MessagesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <MessagesCenter
      title='Messages'
      description='Keep approved conversations connected across customers, couriers, admins, and restaurant owners.'
    />
  );
};

export default MessagesPage;
