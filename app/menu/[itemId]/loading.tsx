'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MenuItemDetailLoading = () => {
  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:py-12'>
      <div className='mb-6 flex items-center gap-2'>
        <Skeleton className='h-4 w-12' />
        <Skeleton className='h-3 w-3 rounded-full' />
        <Skeleton className='h-4 w-36' />
      </div>

      <section className='grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1.25fr)_24rem] xl:grid-cols-[minmax(0,1.35fr)_27rem]'>
        <Card className='self-start overflow-hidden p-0'>
          <Skeleton className='aspect-[4/3] min-h-[17rem] rounded-none sm:min-h-[21rem] md:aspect-auto md:h-[32rem] lg:h-[35rem] xl:h-[36rem]' />
        </Card>

        <div className='space-y-6'>
          <Card className='p-5 sm:p-6'>
            <div className='flex items-center justify-between gap-3'>
              <Skeleton className='h-6 w-16 rounded-full' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-6 w-20 rounded-full' />
                <Skeleton className='h-9 w-24 rounded-md' />
              </div>
            </div>
            <Skeleton className='mt-6 h-9 w-3/4' />
            <Skeleton className='mt-4 h-4 w-32' />
            <div className='mt-6 space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-11/12' />
              <Skeleton className='h-4 w-4/5' />
            </div>
          </Card>

          <Card className='p-5 sm:p-6'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='mt-2 h-9 w-28' />
            <Skeleton className='mt-6 h-4 w-24' />
            <div className='mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3'>
              <Skeleton className='h-11 rounded-md' />
              <Skeleton className='h-11 rounded-md' />
              <Skeleton className='h-11 rounded-md' />
            </div>
            <Skeleton className='mt-6 h-11 w-full rounded-md' />
          </Card>

          <Card className='p-5 sm:p-6'>
            <Skeleton className='h-4 w-44' />
            <div className='mt-3 flex gap-2'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
          </Card>
        </div>
      </section>

      <section className='mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1.25fr)_24rem] xl:grid-cols-[minmax(0,1.35fr)_27rem]'>
        <Card className='p-5 sm:p-6'>
          <div className='grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]'>
            <Skeleton className='h-48 rounded-lg md:h-full' />
            <div className='space-y-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-3'>
                  <Skeleton className='h-7 w-56' />
                  <Skeleton className='h-4 w-32' />
                </div>
                <Skeleton className='h-9 w-9 rounded-md' />
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-4 w-52' />
                <Skeleton className='h-4 w-44' />
              </div>
              <Skeleton className='h-10 w-44 rounded-md' />
            </div>
          </div>
        </Card>

        <Card className='p-5 sm:p-6'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-6 w-36' />
          </div>
          <div className='mt-5 space-y-3'>
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-28' />
              </div>
            ))}
          </div>
          <div className='mt-6 border-t pt-5'>
            <Skeleton className='h-4 w-44' />
            <div className='mt-3 flex gap-2'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
};

export default MenuItemDetailLoading;
