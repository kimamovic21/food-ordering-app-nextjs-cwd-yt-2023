'use client';

import { Skeleton } from '@/components/ui/skeleton';

const DELIVERY_SKELETON_COUNT = 9;

const MyDeliveriesLoading = () => {
  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <Skeleton className='mb-8 h-9 w-56' />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[...Array(DELIVERY_SKELETON_COUNT)].map((_, idx) => (
          <div key={idx} className='rounded-xl border bg-card p-6 shadow-sm space-y-5'>
            <div className='space-y-3'>
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-5 w-20' />
            </div>

            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <Skeleton className='mt-1 h-4 w-4 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-48' />
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-24' />
              </div>

              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-20' />
              </div>

              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyDeliveriesLoading;
