'use client';

import { Skeleton } from '@/components/ui/skeleton';

const CourierDashboardReviewsLoading = () => {
  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-4 w-[520px] max-w-full' />
        </div>
        <Skeleton className='h-5 w-40' />
      </div>

      <div className='rounded-xl border border-border/70 bg-card/80 p-6 space-y-4'>
        <Skeleton className='h-6 w-44' />
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <Skeleton className='h-6 w-36' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
      </div>

      <div className='rounded-xl border border-border/70 bg-card/80 p-6 space-y-4'>
        <Skeleton className='h-6 w-20' />
        <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </div>

      <div className='grid gap-4'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-40 w-full rounded-xl' />
        ))}
      </div>
    </section>
  );
};

export default CourierDashboardReviewsLoading;
