import { Eye } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatAppDateTime } from '@/libs/dateFormat';
import Link from 'next/link';

type OrderType = {
  _id: string;
  email: string;
  total: number;
  paymentStatus: boolean;
  orderStatus:
    | 'placed'
    | 'processing'
    | 'ready'
    | 'transportation'
    | 'delivered'
    | 'completed'
    | 'canceled';
  createdAt: string;
};

type OrdersTableProps = {
  orders: OrderType[];
  loading: boolean;
};

const OrdersTable = ({ orders, loading }: OrdersTableProps) => {
  if (loading) {
    return <p className='text-gray-600 dark:text-gray-400'>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p className='text-gray-600 dark:text-gray-400'>No orders found.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900'>
      <Table className='w-full min-w-[900px] table-fixed'>
        <TableHeader className='bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground'>
          <TableRow>
            <TableHead className='p-3 w-32'>Order ID</TableHead>
            <TableHead className='p-3 w-52'>Date</TableHead>
            <TableHead className='p-3 w-64'>Email</TableHead>
            <TableHead className='p-3 w-32'>Total</TableHead>
            <TableHead className='p-3 w-28'>Payment</TableHead>
            <TableHead className='p-3 w-36'>Order Status</TableHead>
            <TableHead className='p-3 w-28'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='divide-y divide-gray-100 dark:divide-gray-700'>
          {orders.map((order) => (
            <TableRow
              key={order._id}
              className='bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            >
              <TableCell className='p-3 text-gray-600 dark:text-gray-400 text-sm font-mono'>
                {order._id.substring(0, 8)}...
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>
                {formatAppDateTime(order.createdAt)}
              </TableCell>
              <TableCell className='p-3 text-gray-700 dark:text-gray-300'>{order.email}</TableCell>
              <TableCell className='p-3 font-semibold text-gray-900 dark:text-gray-100'>
                ${order.total.toFixed(2)}
              </TableCell>
              <TableCell className='p-3'>
                <Badge
                  variant={order.paymentStatus ? 'default' : 'destructive'}
                  className={
                    order.paymentStatus
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-gray-950 dark:hover:bg-emerald-500'
                      : 'bg-red-600 text-white hover:bg-red-600 dark:bg-red-500 dark:text-gray-950 dark:hover:bg-red-500'
                  }
                >
                  {order.paymentStatus ? 'Paid' : 'Unpaid'}
                </Badge>
              </TableCell>
              <TableCell className='p-3'>
                <Badge
                  variant='secondary'
                  className={
                    order.orderStatus === 'canceled'
                      ? 'bg-red-100 text-red-800 hover:bg-red-100 capitalize'
                      : order.orderStatus === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 capitalize'
                        : order.orderStatus === 'delivered'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
                          : order.orderStatus === 'processing'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 capitalize'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize'
                  }
                >
                  {order.orderStatus}
                </Badge>
              </TableCell>
              <TableCell className='p-3'>
                <Link href={`/admin-dashboard/orders/${order._id}`}>
                  <Eye className='size-5' />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
