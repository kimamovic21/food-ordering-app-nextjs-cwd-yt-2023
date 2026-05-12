'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Title from '@/components/shared/Title';
import ResendVerificationForm from './ResendVerificationForm';
import { Button } from '@/components/ui/button';

type VerifyEmailClientProps = {
  defaultEmail?: string;
};

const VerifyEmailClient = ({ defaultEmail = '' }: VerifyEmailClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email') || defaultEmail;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyEmail = async () => {
      setStatus('loading');

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const responseBody = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(responseBody?.error || 'Email verification failed.');
        }

        setStatus('success');
        setMessage(responseBody?.message || 'Your email has been verified successfully.');
        toast.success('Your email has been verified successfully.', {
          style: { backgroundColor: '#22c55e', color: 'white' },
        });
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Email verification failed.');
        toast.error(error instanceof Error ? error.message : 'Email verification failed.', {
          style: { backgroundColor: '#ef4444', color: 'white' },
        });
      }
    };

    void verifyEmail();
  }, [token]);

  return (
    <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4 space-y-6'>
      <div className='text-center mb-4'>
        <Title className='text-4xl'>Verify email</Title>
      </div>

      {token ? (
        <div className='rounded-2xl border border-border bg-card p-6 text-center space-y-4'>
          <p className='text-muted-foreground'>
            {status === 'loading'
              ? 'Verifying your email address...'
              : message || 'Processing verification...'}
          </p>

          {status === 'success' ? (
            <Button onClick={() => router.push('/login')} className='w-full sm:w-auto'>
              Go to login
            </Button>
          ) : null}
        </div>
      ) : (
        <div className='space-y-6 rounded-2xl border border-border bg-card p-6'>
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Check your inbox for the verification link. If you did not receive it, resend it
              below.
            </p>
            <p className='text-sm text-muted-foreground'>
              If you used Google sign-in, you do not need email verification.
            </p>
          </div>

          <ResendVerificationForm defaultEmail={email} />
        </div>
      )}
    </section>
  );
};

export default VerifyEmailClient;
