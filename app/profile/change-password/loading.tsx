'use client';

import Link from 'next/link';
import Title from '@/components/shared/Title';
import { Skeleton } from '@/components/ui/skeleton';

const ChangePasswordLoading = () => {
  return (
    <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4'>
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
        <Skeleton className='mx-auto mt-3 h-4 w-72' />
      </div>

      <div className='w-full max-w-3xl mx-auto space-y-6'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-9 w-full' />
          </div>

          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-9 w-full' />
            <div className='space-y-2 pt-1'>
              <Skeleton className='h-1 w-full' />
              <Skeleton className='h-4 w-52 mx-auto' />
              <div className='space-y-1.5 max-w-xs mx-auto'>
                <Skeleton className='h-3.5 w-full' />
                <Skeleton className='h-3.5 w-full' />
                <Skeleton className='h-3.5 w-full' />
                <Skeleton className='h-3.5 w-full' />
                <Skeleton className='h-3.5 w-full' />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-9 w-full' />
          </div>

          <Skeleton className='h-9 w-full' />
        </div>
      </div>
    </section>
  );
};

export default ChangePasswordLoading;