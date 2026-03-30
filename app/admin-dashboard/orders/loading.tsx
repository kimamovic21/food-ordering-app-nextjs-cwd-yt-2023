import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const OrdersLoading = () => {
  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10'>
      <Skeleton className='h-9 w-32' />

      <div className='mt-8 flex-1 w-full'>
        <Card className='border border-border bg-card text-card-foreground shadow-sm'>
          <div className='overflow-x-auto'>
            <Table className='w-full min-w-[900px] table-fixed'>
              <TableHeader>
                <TableRow>
                  {[...Array(6)].map((_, idx) => (
                    <TableHead key={idx} className='p-3'>
                      <Skeleton className='h-4 w-24' />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {[...Array(6)].map((_, cellIdx) => (
                      <TableCell key={cellIdx} className='p-3'>
                        <Skeleton className='h-4 w-full' />
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

export default OrdersLoading;
