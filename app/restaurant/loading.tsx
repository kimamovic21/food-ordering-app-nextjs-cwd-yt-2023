const RestaurantLoading = () => {
  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      <div className='animate-pulse'>
        <div className='flex justify-between items-center mb-6'>
          <div className='h-10 bg-muted rounded w-1/3' />
          <div className='flex gap-2'>
            <div className='h-10 w-24 bg-muted rounded' />
            <div className='h-10 w-24 bg-muted rounded' />
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='h-96 bg-muted rounded' />
          <div className='h-96 bg-muted rounded' />
          <div className='h-96 bg-muted rounded' />
          <div className='h-96 bg-muted rounded' />
        </div>
      </div>
    </div>
  );
};

export default RestaurantLoading;
