'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const RestaurantsLoading = () => {
  return (
    <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      {/* Title Section */}
      <div className='mb-6 flex flex-col gap-3'>
        {/* Title - "Restaurants" */}
        <Skeleton className='h-12 w-64 rounded-lg' />

        {/* Description */}
        <Skeleton className='h-5 w-full max-w-3xl rounded-lg' />
      </div>

      {/* Search Input */}
      <div className='mb-8'>
        <div className='relative'>
          <Skeleton className='h-11 w-full rounded-md' />
        </div>
      </div>

      {/* Restaurant Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 9 }).map((_, index) => (
          <Card
            key={index}
            className='overflow-hidden border-border/80 hover:shadow-md transition-shadow'
          >
            <CardContent className='p-0'>
              {/* Card Image */}
              <Skeleton className='h-48 w-full rounded-none' />

              {/* Card Content */}
              <div className='p-4 space-y-3'>
                {/* Restaurant Name */}
                <Skeleton className='h-5 w-2/3 rounded-md' />

                {/* Location Info */}
                <Skeleton className='h-4 w-1/2 rounded-md' />

                {/* Description Line 1 */}
                <Skeleton className='h-4 w-full rounded-md' />

                {/* Description Line 2 */}
                <Skeleton className='h-4 w-5/6 rounded-md' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default RestaurantsLoading;
