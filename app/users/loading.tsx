import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const UsersLoading = () => {
  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Skeleton className='h-10 w-32 mb-8' />

      <div className='mt-8 flex-1 flex flex-col'>
        <div className='flex-1'>
          <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 shadow-sm'>
            <Table className='w-full min-w-[1100px] table-fixed'>
              <TableHeader className='bg-gray-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300'>
                <TableRow>
                  <TableHead className='p-3 w-28'>Photo</TableHead>
                  <TableHead className='p-3 w-40'>Name</TableHead>
                  <TableHead className='p-3 w-56'>Email</TableHead>
                  <TableHead className='p-3 w-36'>Phone</TableHead>
                  <TableHead className='p-3 w-52'>Street address</TableHead>
                  <TableHead className='p-3 w-44'>City / Postal</TableHead>
                  <TableHead className='p-3 w-36'>Country</TableHead>
                  <TableHead className='p-3 w-24'>Role</TableHead>
                  <TableHead className='p-3 w-24'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='divide-y divide-gray-100 dark:divide-gray-700'>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className='p-3'>
                      <Skeleton className='size-12 rounded-full' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-32' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-48' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-28' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-40' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-32' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-4 w-28' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-6 w-16' />
                    </TableCell>
                    <TableCell className='p-3'>
                      <Skeleton className='h-8 w-16' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className='mt-auto pt-4 pb-4'>
          <div className='flex items-center justify-center gap-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-10 w-20' />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UsersLoading;
