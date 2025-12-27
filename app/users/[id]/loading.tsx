import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

const UserLoading = () => {
  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href='/users' className='hover:underline'>
              Users
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>User Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
              <Skeleton className='h-5 w-56' />
            </div>
            <div>
              <Skeleton className='h-4 w-16 mb-1' />
              <Skeleton className='h-5 w-32' />
            </div>
            <div>
              <Skeleton className='h-4 w-28 mb-1' />
              <Skeleton className='h-5 w-48' />
            </div>
            <div>
              <Skeleton className='h-4 w-16 mb-1' />
              <Skeleton className='h-5 w-32' />
            </div>
            <div>
              <Skeleton className='h-4 w-24 mb-1' />
              <Skeleton className='h-5 w-24' />
            </div>
            <div>
              <Skeleton className='h-4 w-20 mb-1' />
              <Skeleton className='h-5 w-40' />
            </div>
            <div className='md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <Skeleton className='h-4 w-20 mb-1' />
              <Skeleton className='h-5 w-64' />
            </div>
            <div>
              <Skeleton className='h-4 w-28 mb-1' />
              <Skeleton className='h-5 w-16' />
            </div>
            <div>
              <Skeleton className='h-4 w-24 mb-1' />
              <Skeleton className='h-5 w-48' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLoading;
