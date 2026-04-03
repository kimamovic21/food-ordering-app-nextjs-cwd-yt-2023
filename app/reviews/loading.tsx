import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ReviewsLoading = () => {
  return (
    <section className='space-y-6'>
      <div className='space-y-3'>
        <Skeleton className='h-10 w-56' />
        <Skeleton className='h-5 w-96' />
      </div>
      <Card>
        <CardContent className='space-y-4 p-6'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-40 w-full' />
        </CardContent>
      </Card>
      <Skeleton className='h-40 w-full rounded-xl' />
      <Skeleton className='h-40 w-full rounded-xl' />
    </section>
  );
};

export default ReviewsLoading;
