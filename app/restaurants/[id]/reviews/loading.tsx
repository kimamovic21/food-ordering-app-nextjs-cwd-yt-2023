'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RestaurantReviewsLoading = () => {
  return (
    <section className='mt-8 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <div className='mb-6 flex items-center gap-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-36' />
      </div>

      <div className='mb-6 space-y-2'>
        <Skeleton className='h-10 w-96 max-w-full' />
        <Skeleton className='h-4 w-64' />
      </div>

      <div className='space-y-4'>
        {Array.from({ length: 10 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
                <Skeleton className='h-5 w-24' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-11/12' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-8'>
        <Skeleton className='h-10 w-52' />
      </div>
    </section>
  );
};

export default RestaurantReviewsLoading;
