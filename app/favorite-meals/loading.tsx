'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FavoriteMealsLoading = () => {
  return (
    <section className='mt-8'>
      <div className='mb-6 space-y-3'>
        <Skeleton className='h-10 w-64 rounded-md' />
        <Skeleton className='h-5 w-full max-w-lg rounded-md' />
      </div>

      <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='p-0 overflow-hidden flex flex-col'>
            <div className='p-4 bg-muted'>
              <Skeleton className='h-40 w-full rounded-md' />
            </div>
            <CardContent className='p-4 space-y-4'>
              <Skeleton className='h-6 w-2/3 mx-auto rounded-md' />
              <Skeleton className='h-10 w-full rounded-md' />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FavoriteMealsLoading;
