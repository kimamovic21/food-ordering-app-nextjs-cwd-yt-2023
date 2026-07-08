import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authOptions } from '@/libs/authOptions';
import { createPageMetadata } from '@/libs/metadata';
import MessageSoundSettingsForm from './MessageSoundSettingsForm';

export const metadata = createPageMetadata({
  title: 'Message Settings',
  description: 'Manage message sound preferences.',
  path: '/messages/settings',
  noIndex: true,
});

const MessageSettingsPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <section className='mx-auto mt-8 flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 sm:px-6 lg:px-8'>
      <div className='mb-6 flex items-start gap-4'>
        <Link
          href='/messages'
          className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted'
          aria-label='Back to messages'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Message Settings</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Choose whether this account should play a sound for new messages.
          </p>
        </div>
      </div>

      <MessageSoundSettingsForm />
    </section>
  );
};

export default MessageSettingsPage;
