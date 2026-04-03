'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <Skeleton className='mb-6 h-6 w-56' />

      <div className='mb-6'>
        <Skeleton className='mb-2 h-10 w-64' />
        <Skeleton className='h-5 w-36' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-6 w-44' />
              <Skeleton className='h-6 w-36' />
              <Skeleton className='h-6 w-48' />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='mt-6'>
        <CardHeader>
          <Skeleton className='h-7 w-40' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-4 p-4 border rounded-lg'>
              <Skeleton className='h-20 w-20 rounded-md shrink-0' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-14' />
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
