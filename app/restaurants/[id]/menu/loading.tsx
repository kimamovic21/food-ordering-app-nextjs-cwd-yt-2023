'use client';

import { Skeleton } from '@/components/ui/skeleton';
import MenuPageSkeleton from './MenuPageSkeleton';

const RestaurantMenuPageLoading = () => {
  return (
    <main className='max-w-7xl mx-auto px-4 py-12'>
      <div className='mb-4 flex items-center gap-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-24' />
      </div>

      <MenuPageSkeleton sectionCount={1} cardsPerSection={3} />
    </main>
  );
};

export default RestaurantMenuPageLoading;
