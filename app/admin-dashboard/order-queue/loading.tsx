import { Skeleton } from '@/components/ui/skeleton';

const OrderQueueLoading = () => (
  <section className='space-y-6'>
    <Skeleton className='h-10 w-64' />
    <div className='grid gap-4 xl:grid-cols-5'>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className='h-72 rounded-lg' />
      ))}
    </div>
  </section>
);

export default OrderQueueLoading;
