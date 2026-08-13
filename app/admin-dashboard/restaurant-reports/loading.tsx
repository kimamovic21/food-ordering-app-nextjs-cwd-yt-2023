import { Skeleton } from '@/components/ui/skeleton';

const RestaurantReportsLoading = () => {
  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-3'>
          <Skeleton className='h-9 w-64 rounded-md' />
          <Skeleton className='h-5 w-96 max-w-full rounded-md' />
        </div>
        <Skeleton className='h-10 w-36 rounded-md' />
      </div>
      <Skeleton className='h-36 rounded-lg' />
      <div className='grid gap-4 md:grid-cols-3'>
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-lg' />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Skeleton className='h-72 rounded-lg' />
        <Skeleton className='h-72 rounded-lg' />
      </div>
    </section>
  );
};

export default RestaurantReportsLoading;
