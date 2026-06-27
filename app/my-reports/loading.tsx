'use client';

import { Skeleton } from '@/components/ui/skeleton';

const MyReportsLoading = () => {
  return (
    <section className='mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-6 space-y-3'>
        <Skeleton className='h-9 w-48' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>

      <div className='mb-6 grid gap-4 md:grid-cols-3'>
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className='h-24 rounded-xl' />
        ))}
      </div>

      <div className='space-y-4'>
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className='h-48 rounded-xl' />
        ))}
      </div>
    </section>
  );
};

export default MyReportsLoading;
