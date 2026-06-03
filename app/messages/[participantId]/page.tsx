import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { createPageMetadata } from '@/libs/metadata';
import MessagesCenter from '@/components/shared/MessagesCenter';

export const metadata = createPageMetadata({
  title: 'Conversation',
  description: 'Chat with the selected person in the approved message flow.',
  path: '/messages',
  noIndex: true,
});

const ConversationPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <MessagesCenter
      title='Conversation'
      description='This thread is restricted to the allowed sender and recipient roles for the selected order or staff chat.'
    />
  );
};

export default ConversationPage;
