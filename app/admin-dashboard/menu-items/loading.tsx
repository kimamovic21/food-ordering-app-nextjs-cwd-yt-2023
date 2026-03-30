const Skeleton = ({ className }: { className?: string }) => {
  return <div className={`bg-muted rounded-md animate-pulse ${className || ''}`} />;
};

const MenuItemsLoading = () => {
  return (
    <section className='mt-8'>
      <Skeleton className='h-6 w-32 mb-4' />
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-9 w-36' />
      </div>

      <div className='mt-12 space-y-10'>
        {[1, 2, 3].map((section) => (
          <section key={section}>
            <Skeleton className='h-6 w-24 mb-4' />
            <div className='grid grid-cols-1 gap-4 space-y-4'>
              {[1, 2].map((item) => (
                <div key={item} className='flex items-center gap-4 p-4'>
                  <Skeleton className='w-24 h-24 rounded-lg shrink-0' />
                  <div className='grow space-y-2'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-3 w-24' />
                    <Skeleton className='h-3 w-48' />
                    <div className='flex gap-3 pt-2'>
                      <Skeleton className='h-4 w-16' />
                      <Skeleton className='h-4 w-16' />
                      <Skeleton className='h-4 w-16' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};

export default MenuItemsLoading;
