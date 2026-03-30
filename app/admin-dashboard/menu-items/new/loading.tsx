const Skeleton = ({ className }: { className?: string }) => {
  return <div className={`bg-muted rounded-md animate-pulse ${className || ''}`} />;
};

const NewMenuItemLoading = () => {
  return (
    <section className='mt-8'>
      <Skeleton className='h-6 w-48 mb-4' />
      <Skeleton className='h-8 w-64 mb-8' />

      <div className='mt-8 max-w-2xl lg:max-w-3xl mx-auto'>
        <div className='flex flex-col md:flex-row items-start gap-6'>
          <div className='flex flex-col items-center gap-3'>
            <Skeleton className='w-16 h-16 md:w-24 md:h-24 lg:w-40 lg:h-40 rounded-lg' />
            <Skeleton className='w-18 h-9' />
          </div>

          <div className='w-full space-y-4'>
            <div>
              <Skeleton className='h-4 w-64 mb-2' />
              <Skeleton className='w-full h-9' />
            </div>
            <div>
              <Skeleton className='h-4 w-56 mb-2' />
              <Skeleton className='w-full h-9' />
            </div>
            <div>
              <Skeleton className='h-4 w-60 mb-2' />
              <Skeleton className='w-full h-24' />
            </div>
            <div>
              <Skeleton className='h-4 w-60 mb-2' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                <div>
                  <Skeleton className='h-3 w-28 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
                <div>
                  <Skeleton className='h-3 w-32 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
                <div>
                  <Skeleton className='h-3 w-28 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
              </div>
            </div>
            <div className='flex gap-2 pt-2'>
              <Skeleton className='grow h-9' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewMenuItemLoading;
