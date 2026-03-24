import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuPageSkeletonProps {
  showSidebar?: boolean;
  sectionCount?: number;
  cardsPerSection?: number;
}

const MenuPageSkeleton = ({
  showSidebar = true,
  sectionCount = 1,
  cardsPerSection = 1,
}: MenuPageSkeletonProps) => {
  return (
    <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start'>
      <div className='space-y-10'>
        <div className='space-y-6'>
          <header className='space-y-3'>
            <Skeleton className='h-10 w-56' />
            <Skeleton className='h-5 w-80 max-w-full' />
          </header>

          <div className='flex flex-col sm:flex-row gap-3 sm:items-center'>
            <Skeleton className='h-11 w-full' />
          </div>
        </div>

        <div className='space-y-10'>
          {Array.from({ length: sectionCount }).map((_, index) => (
            <section key={index} className='space-y-4'>
              <div className='flex items-center justify-between gap-2'>
                <Skeleton className='h-8 w-40' />
                <Skeleton className='h-4 w-20' />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Array.from({ length: cardsPerSection }).map((_, cardIndex) => (
                  <Card key={cardIndex} className='p-0 overflow-hidden flex flex-col'>
                    <div className='relative h-40 p-4 bg-muted'>
                      <Skeleton className='mx-auto h-32 w-32 rounded-full' />
                    </div>

                    <div className='p-4 flex flex-col flex-1'>
                      <Skeleton className='h-7 w-3/4 mb-4' />

                      <Skeleton className='h-12 w-full mt-4' />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {showSidebar && (
        <Card className='w-full p-5 space-y-5'>
          <Skeleton className='h-6 w-20' />
          <Skeleton className='h-10 w-full' />

          <div className='space-y-3'>
            <Skeleton className='h-8 w-40' />
            {[1].map((item) => (
              <div key={item} className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-24' />
              </div>
            ))}
          </div>

          <div className='space-y-3'>
            <Skeleton className='h-4 w-20' />
            <div className='grid grid-cols-2 gap-3'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>

          <div className='space-y-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </Card>
      )}
    </div>
  );
};

export default MenuPageSkeleton;
