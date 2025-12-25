import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OrderType = {
  _id: string;
  email: string;
  total: number;
  paid: boolean;
  createdAt: string;
};

type OrdersTableProps = {
  orders: OrderType[];
  loading: boolean;
};

const OrdersTable = ({ orders, loading }: OrdersTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <p>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  return (
    <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 shadow-sm'>
      <div className='overflow-x-auto'>
        <Table className='w-full min-w-[900px] table-fixed'>
          <TableHeader className='bg-gray-50 dark:bg-slate-900 text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300'>
            <TableRow>
              <TableHead className='p-3 w-32'>Order ID</TableHead>
              <TableHead className='p-3 w-52'>Date</TableHead>
              <TableHead className='p-3 w-64'>Email</TableHead>
              <TableHead className='p-3 w-32'>Total</TableHead>
              <TableHead className='p-3 w-32'>Status</TableHead>
              <TableHead className='p-3 w-32'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-gray-100 dark:divide-gray-700'>
            {orders.map((order) => (
              <TableRow key={order._id} className='hover:bg-gray-50 dark:hover:bg-slate-900'>
                <TableCell className='p-3 font-semibold text-gray-900 dark:text-gray-100 text-xs'>
                  {order._id.substring(0, 8)}...
                </TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{order.email}</TableCell>
                <TableCell className='p-3 font-semibold text-gray-900 dark:text-gray-100'>
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell className='p-3'>
                  <Badge
                    variant={order.paid ? 'default' : 'destructive'}
                    className={order.paid ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {order.paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TableCell>
                <TableCell className='p-3'>
                  <Link href={`/orders/${order._id}`}>
                    <Button size='sm' variant='default'>
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersTable;