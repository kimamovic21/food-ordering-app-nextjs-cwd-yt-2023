import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const UserLoading = () => {
  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Skeleton className='h-4 w-12' />
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <Skeleton className='h-4 w-2' />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <Skeleton className='h-4 w-24' />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='flex flex-col gap-6'>
        <div className='max-w-4xl mx-auto w-full space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* User Profile Skeleton */}
              <div className='flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700'>
                <Skeleton className='size-20 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-8 w-40' />
                  <Skeleton className='h-6 w-20' />
                </div>
              </div>

              {/* User Information Grid Skeleton */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <Skeleton className='h-4 w-16 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-16 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-28 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-16 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-24 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-20 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div className='md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
                  <Skeleton className='h-4 w-20 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-28 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
                <div>
                  <Skeleton className='h-4 w-24 mb-1' />
                  <Skeleton className='h-5 w-full' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-20' />
            </CardHeader>
            <CardContent className='min-h-80'>
              <Skeleton className='h-80 rounded-lg w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserLoading;
