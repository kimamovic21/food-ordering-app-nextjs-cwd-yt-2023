import { Skeleton } from '@/components/ui/skeleton';

const CategoriesLoading = () => {
  return (
    <section className='mt-8 w-full px-4 max-w-4xl mx-auto space-y-8'>
      <div className='space-y-3'>
        <div className='h-8 w-40'>
          <Skeleton className='h-full w-full' />
        </div>

        <div className='bg-card border border-border rounded-lg p-6 space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-10 w-full' />
          </div>
          <Skeleton className='h-10 w-28' />
        </div>
      </div>

      <div className='space-y-4'>
        <div className='h-8 w-48'>
          <Skeleton className='h-full w-full' />
        </div>
        <Skeleton className='h-4 w-80' />

        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className='bg-card border border-border rounded-lg p-4'>
              <div className='flex items-center justify-between gap-3'>
                <Skeleton className='h-4 w-32' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-9 w-9 rounded-md' />
                  <Skeleton className='h-9 w-12 rounded-full' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesLoading;
