'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import ChangePasswordForm from './ChangePasswordForm';
import ChangePasswordLoading from './loading';
import type { ExtendedUser } from '@/types/user';

const ChangePasswordPage = () => {
  const { status, data: sessionData } = useSession();
  const router = useRouter();
  const user = sessionData?.user as ExtendedUser | undefined;
  const isOauthUser = user?.provider === 'oauth';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <ChangePasswordLoading />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const pageHeader = (
    <div className='text-center mb-8'>
      <nav aria-label='Breadcrumb' className='mb-3 flex justify-center'>
        <ol className='flex items-center gap-2 text-sm text-muted-foreground'>
          <li>
            <Link href='/profile' className='hover:text-foreground'>
              Profile
            </Link>
          </li>
          <li aria-hidden='true'>&gt;</li>
          <li className='text-foreground'>Change password</li>
        </ol>
      </nav>
      <Title className='text-4xl'>Change password</Title>
    </div>
  );

  if (isOauthUser) {
    return (
      <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4'>
        {pageHeader}
        <p className='rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'>
          You registered with Google, so password updates are not available. Use your Google account
          to sign in.
        </p>
      </section>
    );
  }

  return (
    <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4'>
      {pageHeader}
      <p className='mt-2 mb-6 text-center text-sm text-muted-foreground'>
        Use your current password to set a stronger one.
      </p>
      <ChangePasswordForm />
    </section>
  );
};

export default ChangePasswordPage;
