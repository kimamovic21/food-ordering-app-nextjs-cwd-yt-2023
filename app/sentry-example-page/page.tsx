import { notFound } from 'next/navigation';
import SentryExampleClient from './SentryExampleClient';

const SentryExamplePage = () => {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className='mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6'>
      <div className='rounded-lg border border-border bg-background p-6'>
        <p className='text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground'>
          Development only
        </p>
        <h1 className='mt-3 text-3xl font-bold'>Sentry test page</h1>
        <p className='mt-3 text-muted-foreground'>
          Use this button locally to send a real browser error through the app Sentry setup.
        </p>
        <div className='mt-6'>
          <SentryExampleClient />
        </div>
      </div>
    </main>
  );
};

export default SentryExamplePage;
