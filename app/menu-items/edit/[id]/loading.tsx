const Skeleton = ({ className }: { className?: string }) => {
  return <div className={`bg-muted rounded-md animate-pulse ${className || ''}`} />;
};

const EditMenuItemLoading = () => {
  return (
    <section className='mt-8'>
      <Skeleton className='h-6 w-48 mb-4' />
      <Skeleton className='h-8 w-56 mb-8' />

      <div className='mt-8 max-w-2xl lg:max-w-3xl mx-auto'>
        <div className='flex flex-col md:flex-row items-start gap-6'>
          {/* Image skeleton */}
          <div className='flex flex-col items-center gap-3'>
            <Skeleton className='w-28 h-28 md:w-36 md:h-36 lg:w-64 lg:h-64 rounded-lg' />
            <Skeleton className='w-24 h-9' />
          </div>

          {/* Form skeleton */}
          <div className='w-full space-y-4'>
            <div>
              <Skeleton className='h-4 w-32 mb-2' />
              <Skeleton className='w-full h-9' />
            </div>
            <div>
              <Skeleton className='h-4 w-20 mb-2' />
              <Skeleton className='w-full h-9' />
            </div>
            <div>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='w-full h-24' />
            </div>
            <div>
              <Skeleton className='h-4 w-28 mb-2' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                <div>
                  <Skeleton className='h-3 w-12 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
                <div>
                  <Skeleton className='h-3 w-16 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
                <div>
                  <Skeleton className='h-3 w-12 mb-1' />
                  <Skeleton className='w-full h-9' />
                </div>
              </div>
            </div>
            <div className='flex gap-2 pt-2'>
              <Skeleton className='grow h-9' />
              <Skeleton className='w-20 h-9' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditMenuItemLoading;
