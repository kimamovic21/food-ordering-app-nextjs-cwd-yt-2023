import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboardPageLoading = () => {
  return (
    <section className='w-full min-h-screen flex flex-col md:flex-row'>
      <aside className='hidden md:flex md:flex-col md:sticky md:top-0 w-72 h-screen bg-card border-r border-border overflow-y-auto'>
        <div className='p-6 border-b border-border space-y-3'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-7 w-40' />
        </div>

        <div className='px-4 pt-4 pb-3 border-b border-border'>
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>

        <div className='flex-1 p-4 space-y-2'>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className='h-12 w-full rounded-lg' />
          ))}
        </div>

        <div className='border-t border-border p-4 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-6 w-24 rounded-full' />
          </div>
          <Skeleton className='h-10 w-full rounded-lg' />
        </div>
      </aside>

      <div className='md:hidden p-4 border-b border-border bg-card'>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>

      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 md:p-6 space-y-8'>
          <Skeleton className='h-56 w-full rounded-2xl' />
          <div className='space-y-4'>
            <Skeleton className='h-8 w-44' />
            <div className='grid gap-4 md:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-56 w-full rounded-xl' />
              ))}
            </div>
          </div>
          <Skeleton className='h-28 w-full rounded-xl' />
        </div>
      </div>
    </section>
  );
};

export default AdminDashboardPageLoading;
