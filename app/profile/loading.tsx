'use client';

import { Skeleton } from '@/components/ui/skeleton';
import Title from '@/components/shared/Title';

const ProfilePageLoading = () => {
  return (
    <section className='mt-8 max-w-5xl mx-auto'>
      <Title className='text-center'>Profile</Title>

      <div className='max-w-3xl mx-auto mt-8'>
        <div className='flex flex-col md:flex-row gap-4 md:items-start'>
          <div className='flex flex-col items-center'>
            <Skeleton className='w-32 h-32 md:w-36 md:h-36 rounded-md' />
          </div>

          <div className='w-full md:w-[560px] space-y-4'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-9 w-full' />
            </div>

            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-9 w-full' />
            </div>

            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-9 w-full' />
            </div>

            <div className='space-y-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-9 w-full' />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-9 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-9 w-full' />
              </div>
            </div>

            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-9 w-full' />
            </div>

            <Skeleton className='h-9 w-full' />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePageLoading;
