'use client';

import { Card, CardContent } from '@/components/ui/card';

const FavoriteMealsLoading = () => {
  return (
    <section className='mt-8 space-y-6'>
      <div className='mb-6 space-y-2'>
        <div className='h-10 w-64 rounded-md bg-muted animate-pulse' />
        <div className='h-5 w-full max-w-lg rounded-md bg-muted/70 animate-pulse' />
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className='overflow-hidden p-0 flex flex-col'>
            <div className='bg-muted h-40 flex items-center justify-center p-4 animate-pulse'>
              <div className='h-32 w-32 rounded-md bg-background/30' />
            </div>
            <CardContent className='flex flex-1 flex-col p-4'>
              <div className='space-y-2'>
                <div className='mx-auto h-6 w-2/3 rounded-md bg-muted animate-pulse' />
                <div className='flex justify-center gap-1 pt-1'>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <div key={starIndex} className='h-4 w-4 rounded-full bg-muted animate-pulse' />
                  ))}
                </div>
              </div>

              <div className='mt-4 flex items-center justify-center gap-2'>
                <div className='h-10 flex-1 rounded-md bg-muted animate-pulse' />
                <div className='h-10 w-12 rounded-md bg-muted animate-pulse' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FavoriteMealsLoading;
