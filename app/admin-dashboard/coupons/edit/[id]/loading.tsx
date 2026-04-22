'use client';

import { Skeleton } from '@/components/ui/skeleton';

const EditCouponLoading = () => {
  return (
    <section className='mt-8 pb-10 max-w-4xl mx-auto space-y-4'>
      <Skeleton className='h-4 w-48' />
      <Skeleton className='h-10 w-56' />
      <Skeleton className='h-[500px] w-full rounded-2xl' />
    </section>
  );
};

export default EditCouponLoading;
