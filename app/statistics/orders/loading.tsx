'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const OrdersStatisticsLoading = () => {
  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      {/* Breadcrumb placeholder */}
      <div className='mb-4 flex items-center gap-2 text-sm text-muted-foreground'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-3 w-4' />
        <Skeleton className='h-4 w-24' />
      </div>

      {/* Title */}
      <Skeleton className='h-9 w-44' />

      {/* Metric cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6'>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className='h-full overflow-hidden'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>
                <Skeleton className='h-4 w-28 max-w-full' />
              </CardTitle>
              <CardDescription>
                <Skeleton className='h-3 w-32 max-w-full' />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className='h-7 w-16 max-w-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders over time chart */}
      <Card className='mt-8'>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-2'>
              <Skeleton className='h-5 w-36' />
              <Skeleton className='h-4 w-56' />
            </div>
            <div className='flex flex-wrap gap-2 justify-end'>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className='h-9 w-28 rounded-full' />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='h-80 w-full rounded-lg border bg-muted/40 p-4'>
            <Skeleton className='h-full w-full rounded-md' />
          </div>
        </CardContent>
      </Card>

      {/* Orders per month chart */}
      <Card className='mt-8'>
        <CardHeader className='space-y-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-52' />
        </CardHeader>
        <CardContent>
          <div className='h-80 w-full rounded-lg border bg-muted/40 p-4'>
            <Skeleton className='h-full w-full rounded-md' />
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default OrdersStatisticsLoading;
