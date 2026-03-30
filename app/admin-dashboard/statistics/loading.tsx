'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StatisticsLoading = () => {
  const valueWidths = ['w-16', 'w-14', 'w-14', 'w-20', 'w-14'];

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Skeleton className='h-9 w-40' />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-8'>
        {valueWidths.map((width, idx) => (
          <Card key={idx} className='h-full flex flex-col overflow-hidden'>
            <CardHeader className='pb-3'>
              <Skeleton className='h-4 w-24 max-w-full' />
            </CardHeader>
            <CardContent className='mt-auto'>
              <Skeleton className={`h-7 ${width} max-w-full`} />
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
