'use client';

import { Skeleton } from '@/components/ui/skeleton';

const CourierDashboardLoading = () => {
  return (
    <section className='w-full min-h-screen xl:h-screen flex flex-col xl:flex-row xl:overflow-hidden bg-linear-to-b from-background to-muted/30'>
      <aside className='hidden xl:flex xl:flex-col w-80 xl:h-full bg-card/80 border-r border-border/70 backdrop-blur overflow-y-auto'>
        <div className='p-6 border-b border-border space-y-3'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-7 w-40' />
        </div>

        <div className='px-4 pt-4 pb-3 border-b border-border'>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>

        <div className='flex-1 p-4 space-y-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-12 w-full rounded-lg' />
          ))}
        </div>

        <div className='border-t border-border p-4 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-6 w-24 rounded-full' />
          </div>
          <Skeleton className='h-10 w-full rounded-lg' />
        </div>
      </aside>

      <div className='xl:hidden p-4 border-b border-border bg-card/80 backdrop-blur'>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>

      <div className='flex-1 xl:h-full xl:overflow-y-auto'>
        <div className='p-4 xl:p-8'>
          <div className='mx-auto w-full max-w-[1380px] rounded-2xl border border-border/60 bg-background/85 shadow-sm p-3 xl:p-5 space-y-6'>
            <Skeleton className='h-10 w-56' />
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-64 w-full rounded-xl' />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourierDashboardLoading;
