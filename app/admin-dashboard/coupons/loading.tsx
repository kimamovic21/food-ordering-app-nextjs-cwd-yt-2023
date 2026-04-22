'use client';

import { Skeleton } from '@/components/ui/skeleton';

const CouponsLoading = () => {
  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <div className='flex items-center justify-between gap-4'>
        <Skeleton className='h-9 w-44' />
        <Skeleton className='h-10 w-40 rounded-full' />
      </div>
      <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className='h-64 rounded-2xl' />
        ))}
      </div>
    </section>
  );
};

export default CouponsLoading;
