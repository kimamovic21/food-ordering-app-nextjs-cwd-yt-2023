import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const MenuPageLoading = () => {
  const categories = ['Pizza', 'Pasta', 'Desserts', 'Soup', 'Coffee'];

  return (
    <main className='max-w-6xl mx-auto px-4 py-12'>
      {/* Header Skeleton */}
      <header className='mb-10 text-center'>
        <Skeleton className='h-10 w-32 mx-auto mb-3' />
        <Skeleton className='h-6 w-64 mx-auto' />
      </header>

      {/* Menu Items Skeleton */}
      <div className='space-y-10'>
        {categories.map((category) => (
          <section key={category}>
            {/* Category Title Skeleton */}
            <Skeleton className='h-8 w-24 mb-4' />

            {/* Menu Items Grid Skeleton */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {[...Array(3)].map((_, index) => (
                <Card key={index} className='p-0 overflow-hidden flex flex-col'>
                  {/* Image Skeleton */}
                  <div className='relative h-40 p-4 bg-muted'>
                    <Skeleton className='mx-auto h-32 w-32 rounded-full' />
                  </div>

                  {/* Card Content Skeleton */}
                  <div className='p-4 flex flex-col flex-1'>
                    {/* Title Skeleton */}
                    <Skeleton className='h-7 w-3/4 mb-4' />

                    {/* Description Skeleton */}
                    <div className='space-y-2 flex-1'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-5/6' />
                    </div>

                    {/* Size Buttons Skeleton */}
                    <div className='flex gap-1 justify-center mt-4'>
                      <Skeleton className='h-9 w-20' />
                      <Skeleton className='h-9 w-20' />
                      <Skeleton className='h-9 w-20' />
                    </div>

                    {/* Add to Cart Button Skeleton */}
                    <Skeleton className='h-12 w-full mt-4' />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default MenuPageLoading;
