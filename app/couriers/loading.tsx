import { Skeleton } from '@/components/ui/skeleton';

const CouriersLoading = () => {
  return (
    <section className='w-full md:w-4xl lg:w-5xl max-w-5xl mx-auto px-4 py-6'>
      {/* Header Section */}
      <div className='mb-6'>
        <Skeleton className='h-10 w-96 rounded-md' />
        <Skeleton className='h-5 w-80 mt-2 rounded-md' />
      </div>

      {/* Couriers List Skeleton */}
      <div className='space-y-4'>
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className='rounded-lg border bg-card p-4'>
            <div className='flex items-center gap-4'>
              {/* Avatar Skeleton */}
              <Skeleton className='h-12 w-12 rounded-full shrink-0' />

              {/* Name and Email Skeleton */}
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-48 rounded-md' />
                <Skeleton className='h-4 w-64 rounded-md' />
              </div>

              {/* Availability Badge Skeleton */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-28 rounded-md' />
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>

              {/* Joined Date Skeleton */}
              <Skeleton className='h-4 w-32 rounded-md' />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CouriersLoading;
