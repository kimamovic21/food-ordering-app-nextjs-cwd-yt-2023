'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RestaurantReviewsLoading = () => {
  return (
    <section className='mt-8 space-y-6 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Skeleton className='h-4 w-20' />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Skeleton className='h-4 w-40' />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Skeleton className='h-4 w-40' />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title and Description */}
      <div className='space-y-2'>
        <Skeleton className='h-10 w-80' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </div>

      {/* Main Grid */}
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        {/* Left Column - Reviews */}
        <div className='space-y-4'>
          {/* Review Summary Card */}
          <Card className='border-border/70 bg-card/80'>
            <CardHeader>
              <CardTitle>
                <Skeleton className='h-6 w-40' />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Skeleton className='h-5 w-full max-w-xs' />
              <Skeleton className='h-5 w-full max-w-sm' />
            </CardContent>
          </Card>

          {/* Review Cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='border-border/70'>
              <CardContent className='p-6 space-y-4'>
                {/* Reviewer Info */}
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-5 w-40' />
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-20' />
                    </div>
                  </div>
                  <Skeleton className='h-5 w-16 rounded-full' />
                </div>

                {/* Review Text */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>

                {/* Review Meta */}
                <div className='flex items-center gap-3 text-xs text-muted-foreground pt-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column - Filter Sidebar */}
        <Card className='border-border/70 bg-card/80 h-fit lg:sticky lg:top-24'>
          <CardHeader>
            <CardTitle>
              <Skeleton className='h-6 w-24' />
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Filter Description */}
            <Skeleton className='h-5 w-full max-w-xs' />

            {/* Select Dropdown */}
            <Skeleton className='h-10 w-full rounded-md' />

            {/* Active Filters */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <div className='flex flex-wrap gap-2'>
                <Skeleton className='h-7 w-20 rounded-full' />
                <Skeleton className='h-7 w-24 rounded-full' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default RestaurantReviewsLoading;
