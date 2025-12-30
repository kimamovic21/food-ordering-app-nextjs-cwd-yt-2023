import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const OrderLoading = () => {
  return (
    <section className='mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Skeleton className='h-4 w-16' />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Skeleton className='h-4 w-24' />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-full max-w-xs' />
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[...Array(4)].map((_, idx) => (
                <div key={idx}>
                  <Skeleton className='h-4 w-40 mb-2' />
                  <Skeleton className='h-6 w-full' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-full max-w-xs' />
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[...Array(6)].map((_, idx) => (
                <div key={idx}>
                  <Skeleton className='h-4 w-40 mb-2' />
                  <Skeleton className='h-6 w-full' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-full max-w-xs' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='space-y-2'>
                {[...Array(3)].map((_, idx) => (
                  <Skeleton key={idx} className='h-12 w-full' />
                ))}
              </div>
              <div className='border-t pt-4 space-y-2'>
                <div className='flex justify-between'>
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <div className='flex justify-between border-t pt-2'>
                  <Skeleton className='h-6 w-16' />
                  <Skeleton className='h-6 w-20' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default OrderLoading;
