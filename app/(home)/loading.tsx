import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const HomePageLoading = () => {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className='mt-4 block md:grid md:grid-cols-[0.4fr_0.6fr]'>
        <div className='py-12'>
          {/* Title Skeleton */}
          <div className='space-y-3'>
            <Skeleton className='h-10 w-48' />
            <Skeleton className='h-10 w-64' />
            <Skeleton className='h-10 w-32' />
          </div>

          {/* Description Skeleton */}
          <Skeleton className='h-6 w-3/4 my-6' />

          {/* Buttons Skeleton */}
          <div className='flex gap-4'>
            <Skeleton className='h-12 w-40 rounded-full' />
            <Skeleton className='h-12 w-40 rounded-full' />
          </div>
        </div>

        {/* Image Skeleton */}
        <div className='relative h-80 md:h-full'>
          <Skeleton className='w-full h-full' />
        </div>
      </section>

      {/* HomeMenu Section Skeleton */}
      <section className='my-16'>
        <div className='text-center mb-4'>
          <Skeleton className='h-5 w-24 mx-auto mb-2' />
          <Skeleton className='h-10 w-32 mx-auto' />
        </div>

        {/* Menu Items Grid Skeleton */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, index) => (
            <Card key={index} className='p-0 overflow-hidden flex flex-col'>
              {/* Image Skeleton */}
              <div className='relative h-40 p-4 bg-muted'>
                <Skeleton className='mx-auto h-32 w-32' />
              </div>

              {/* Card Content Skeleton */}
              <div className='p-4 flex flex-col flex-1'>
                {/* Title Skeleton */}
                <Skeleton className='h-7 w-3/4 mb-4' />

                {/* Description Skeleton */}
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-5/6' />
                </div>

                {/* Size Buttons Skeleton */}
                <div className='flex gap-1 justify-center mt-4'>
                  <Skeleton className='h-9 w-20' />
                  <Skeleton className='h-9 w-20' />
                  <Skeleton className='h-9 w-20' />
                </div>

                {/* Add to Cart Button Skeleton */}
                <Skeleton className='h-12 w-full mt-4' />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* AboutUs Section Skeleton (optional) */}
      <section className='my-16'>
        <div className='text-center mb-8'>
          <Skeleton className='h-5 w-32 mx-auto mb-2' />
          <Skeleton className='h-10 w-48 mx-auto' />
        </div>
        <div className='max-w-2xl mx-auto space-y-4'>
          <Skeleton className='h-5 w-full' />
          <Skeleton className='h-5 w-full' />
          <Skeleton className='h-5 w-4/5' />
        </div>
      </section>

      {/* ContactUs Section Skeleton (optional) */}
      <section className='my-16'>
        <div className='text-center mb-8'>
          <Skeleton className='h-5 w-24 mx-auto mb-2' />
          <Skeleton className='h-10 w-40 mx-auto' />
        </div>
        <div className='max-w-md mx-auto space-y-4'>
          <Skeleton className='h-5 w-full' />
          <Skeleton className='h-5 w-3/4 mx-auto' />
        </div>
      </section>
    </>
  );
};

export default HomePageLoading;