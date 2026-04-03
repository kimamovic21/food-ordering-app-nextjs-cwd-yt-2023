'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const RestaurantDetailsLoading = () => {
  return (
    <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      {/* Breadcrumb */}
      <div className='mb-6 flex items-center gap-2 text-sm'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-1' />
        <Skeleton className='h-4 w-40' />
      </div>

      <div className='mb-6 flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className='h-10 w-72 sm:w-80' />
          <div className='flex items-center gap-2 shrink-0'>
            <Skeleton className='h-8 w-28 rounded-full' />
            <Skeleton className='h-10 w-10 rounded-full' />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-4 rounded shrink-0' />
          <Skeleton className='h-4 w-[min(100%,32rem)]' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-16' />
        </div>
        <Skeleton className='h-4 w-56' />
        <Skeleton className='h-10 w-56 rounded-md' />
        <div className='flex flex-col items-start'>
          <Skeleton className='h-4 w-32 mb-3' />
          <div className='inline-flex w-fit flex-nowrap items-center gap-2'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-8 w-8 rounded-full' />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <Skeleton className='h-72 w-full' />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-40' />
            </CardHeader>
            <CardContent className='space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-24' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-5 rounded shrink-0' />
                <Skeleton className='h-5 grow' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-5 rounded shrink-0' />
                <Skeleton className='h-5 grow' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-5 rounded shrink-0' />
                <Skeleton className='h-5 w-28' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4 rounded shrink-0' />
                <Skeleton className='h-4 w-full' />
              </div>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-4/5' />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 rounded shrink-0' />
                <Skeleton className='h-6 w-40' />
              </div>
            </CardHeader>
            <CardContent className='space-y-2'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='flex items-center justify-between text-sm'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-28' />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='mt-8'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-28' />
          </CardHeader>
          <CardContent className='p-0'>
            <Skeleton className='h-96 w-full' />
          </CardContent>
        </Card>
      </div>

      <div className='mt-8 flex gap-3 flex-wrap'>
        <Skeleton className='h-10 w-56 rounded-md' />
        <Skeleton className='h-10 w-48 rounded-md' />
      </div>
    </section>
  );
};

export default RestaurantDetailsLoading;
