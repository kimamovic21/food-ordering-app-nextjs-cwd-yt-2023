'use client';

import { Skeleton } from '@/components/ui/skeleton';

const NotificationsLoading = () => {
  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex items-center gap-3 mb-6'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-3 mb-8'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-24 rounded-2xl' />
        ))}
      </div>

      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-2xl' />
        ))}
      </div>
    </section>
  );
};

export default NotificationsLoading;
