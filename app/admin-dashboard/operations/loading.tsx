import { Skeleton } from '@/components/ui/skeleton';

const AdminOperationsLoading = () => (
  <section className='space-y-6'>
    <div className='flex items-center justify-between gap-4'>
      <div className='space-y-2'>
        <Skeleton className='h-9 w-56' />
        <Skeleton className='h-4 w-80' />
      </div>
      <Skeleton className='h-10 w-28' />
    </div>

    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className='h-32 rounded-xl' />
      ))}
    </div>

    <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
      <Skeleton className='h-80 rounded-xl' />
      <Skeleton className='h-80 rounded-xl' />
    </div>
  </section>
);

export default AdminOperationsLoading;
