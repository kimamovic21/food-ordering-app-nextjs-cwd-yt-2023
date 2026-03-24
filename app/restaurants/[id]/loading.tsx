'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const RestaurantDetailsLoading = () => {
  return (
    <section className='mt-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-4'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-1' />
        <Skeleton className='h-4 w-40' />
      </div>

      {/* Title and Badge */}
      <div className='mb-6 flex flex-col gap-3'>
        <div className='flex items-center justify-between flex-wrap gap-3'>
          <Skeleton className='h-12 w-full max-w-sm' />
          <Skeleton className='h-9 w-32' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-5 rounded-full shrink-0' />
          <Skeleton className='h-5 grow' />
        </div>
      </div>

      {/* Main Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Hero Image Card */}
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <Skeleton className='h-96 w-full rounded-none' />
              {/* Thumbnail Gallery */}
              <div className='grid grid-cols-4 gap-2 p-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='h-28 w-full rounded-md' />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card>
            <CardHeader>
              <Skeleton className='h-7 w-48' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-4/5' />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className='space-y-6'>
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <Skeleton className='h-7 w-32' />
            </CardHeader>
            <CardContent className='space-y-5'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-5 rounded-full shrink-0' />
                  <Skeleton className='h-4 grow' />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Facts Card */}
          <Card>
            <CardHeader>
              <Skeleton className='h-7 w-32' />
            </CardHeader>
            <CardContent className='space-y-5'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-5 rounded-full shrink-0' />
                  <Skeleton className='h-4 grow' />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Working Hours Card */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 rounded-full shrink-0' />
                <Skeleton className='h-7 grow max-w-xs' />
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Card */}
      <div className='mt-8'>
        <Card>
          <CardHeader>
            <Skeleton className='h-7 w-32' />
          </CardHeader>
          <CardContent className='p-0'>
            <Skeleton className='h-96 w-full rounded-none' />
          </CardContent>
        </Card>
      </div>

      {/* Back Button */}
      <div className='mt-8'>
        <Skeleton className='h-10 w-56' />
      </div>
    </section>
  );
};

export default RestaurantDetailsLoading;
