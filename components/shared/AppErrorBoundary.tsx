'use client';

import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const message = error instanceof Error ? error.message : 'The page could not be rendered.';

  return (
    <main className='flex min-h-dvh items-center justify-center bg-background px-4 text-foreground'>
      <section className='w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm'>
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
          <AlertTriangle className='size-6' />
        </div>
        <h1 className='mt-4 text-xl font-semibold'>Something went wrong</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{message}</p>
        <Button type='button' onClick={resetErrorBoundary} className='mt-5'>
          Try again
        </Button>
      </section>
    </main>
  );
};

const AppErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onError={(error, info) => {
        Sentry.captureException(error, {
          extra: {
            componentStack: info.componentStack,
          },
        });
      }}
      resetKeys={[pathname]}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
