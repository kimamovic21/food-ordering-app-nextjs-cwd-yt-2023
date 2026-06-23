'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StatisticsLoading = () => {
  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Skeleton className='h-9 w-40' />

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-8'>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className='h-full flex flex-col overflow-hidden'>
            <CardHeader className='pb-3'>
              <Skeleton className='h-4 w-24 max-w-full' />
            </CardHeader>
            <CardContent className='mt-auto'>
              <Skeleton className='h-7 w-20 max-w-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4'>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className='h-full flex flex-col overflow-hidden'>
            <CardHeader className='pb-3'>
              <Skeleton className='h-4 w-28 max-w-full' />
            </CardHeader>
            <CardContent className='mt-auto'>
              <Skeleton className='h-7 w-16 max-w-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-6 lg:grid-cols-2 mt-8'>
        {Array.from({ length: 2 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader>
              <Skeleton className='h-5 w-36' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {Array.from({ length: 5 }).map((__, itemIdx) => (
                <div key={itemIdx} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-4 w-10' />
                  </div>
                  <Skeleton className='h-2 w-full rounded-full' />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-8 space-y-3'>
        <Skeleton className='h-4 w-28' />
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-10 w-40' />
        </div>
      </div>
    </section>
  );
};

export default StatisticsLoading;
