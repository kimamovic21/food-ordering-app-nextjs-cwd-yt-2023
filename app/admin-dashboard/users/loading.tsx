import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const UsersLoading = () => {
  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Skeleton className='h-9 w-32' />

      <div className='mt-8 flex-1 w-full'>
        <Card className='border border-border bg-card text-card-foreground shadow-sm'>
          <div className='overflow-x-auto'>
            <Table className='w-full table-fixed'>
              <TableHeader>
                <TableRow>
                  {[...Array(10)].map((_, idx) => (
                    <TableHead key={idx} className='p-3'>
                      <Skeleton className='h-4 w-16' />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {[...Array(10)].map((_, cellIdx) => (
                      <TableCell key={cellIdx} className='p-3'>
                        {cellIdx === 1 ? (
                          <Skeleton className='size-10 rounded-full' />
                        ) : cellIdx === 8 ? (
                          <Skeleton className='h-5 w-12' />
                        ) : cellIdx === 9 ? (
                          <Skeleton className='h-7 w-14' />
                        ) : (
                          <Skeleton className='h-3 w-20' />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <div className='mt-6 flex items-center justify-center gap-4 pb-4'>
        <Skeleton className='h-9 w-24' />
        <Skeleton className='h-5 w-28' />
        <Skeleton className='h-9 w-24' />
      </div>
    </section>
  );
};

export default UsersLoading;
