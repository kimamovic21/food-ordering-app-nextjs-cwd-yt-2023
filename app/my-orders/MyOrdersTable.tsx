'use client';

import { useState } from 'react';
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

type MyOrdersTableProps = {
  orders: OrderType[];
  loading: boolean;
};

const MyOrdersTable = ({ orders, loading }: MyOrdersTableProps) => {
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFinishPayment = async (orderId: string) => {
    try {
      setProcessingPayment(orderId);
      const res = await fetch(`/api/payment-link?orderId=${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to get payment link');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Payment link not available');
      }
    } catch (error) {
      console.error('Error fetching payment link:', error);
      alert('Failed to get payment link');
    } finally {
      setProcessingPayment(null);
    }
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
              <TableHead className='p-3 w-40'>Action</TableHead>
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
                  <div className='flex gap-2'>
                    <Link href={`/my-orders/${order._id}`}>
                      <Button size='sm' variant='default'>
                        View
                      </Button>
                    </Link>
                    {!order.paid && (
                      <Button
                        size='sm'
                        variant='default'
                        onClick={() => handleFinishPayment(order._id)}
                        disabled={processingPayment === order._id}
                        className='bg-primary hover:bg-orange-700 whitespace-nowrap'
                      >
                        {processingPayment === order._id ? 'Loading...' : 'Finish Payment'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MyOrdersTable;
