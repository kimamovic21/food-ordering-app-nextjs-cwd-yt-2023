'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FavoriteRestaurantsLoading = () => {
  return (
    <section className='mt-8'>
      <div className='mb-6 space-y-3'>
        <Skeleton className='h-10 w-80 rounded-md' />
        <Skeleton className='h-5 w-full max-w-xl rounded-md' />
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='h-full overflow-hidden border-border/80'>
            <Skeleton className='h-48 w-full rounded-none' />

            <CardHeader className='space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <Skeleton className='h-6 w-2/3 rounded-md' />
                <Skeleton className='h-8 w-8 rounded-full' />
              </div>
              <Skeleton className='h-6 w-16 rounded-full' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-20 rounded-md' />
              </div>
              <Skeleton className='h-4 w-1/2 rounded-md' />
            </CardHeader>

            <CardContent className='space-y-3'>
              <Skeleton className='h-4 w-2/3 rounded-md' />
              <Skeleton className='h-4 w-full rounded-md' />
              <Skeleton className='h-4 w-5/6 rounded-md' />
              <div className='flex items-center gap-2 pt-1'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-8 w-8 rounded-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FavoriteRestaurantsLoading;
