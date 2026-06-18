'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, CreditCard, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
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

type MyOrdersTableProps = {
  orders: OrderType[];
  loading: boolean;
  onOrderUpdated?: (order: OrderType) => void;
};

const MyOrdersTable = ({ orders, loading, onOrderUpdated }: MyOrdersTableProps) => {
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);

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

  const handleIconKeyDown = (event: KeyboardEvent<SVGSVGElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      setCancelingOrder(cancelOrderId);
      const res = await fetch('/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: cancelOrderId, action: 'cancel-order' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      onOrderUpdated?.(data.order);
      setCancelOrderId(null);
      toast.success('Order canceled', {
        style: {
          background: '#22c55e',
          color: 'white',
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setCancelingOrder(null);
    }
  };

  if (loading) {
    return (
      <Card className='border border-border bg-card text-card-foreground shadow-sm'>
        <div className='p-4'>
          <Skeleton className='h-8 w-48 mb-4' />
        </div>

        <div className='overflow-x-auto'>
          <Table className='w-full min-w-[900px] table-fixed'>
            <TableHeader>
              <TableRow>
                {['w-32', 'w-52', 'w-64', 'w-32', 'w-28', 'w-36', 'w-40'].map((w, idx) => (
                  <TableHead key={idx} className='p-3'>
                    <Skeleton className={`h-4 ${w}`} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {[
                    'w-24', // id
                    'w-40', // date
                    'w-64', // email
                    'w-24', // total
                    'w-20', // payment status
                    'w-28', // order status
                    'w-32', // action
                  ].map((w, cellIdx) => (
                    <TableCell key={cellIdx} className='p-3'>
                      <Skeleton className={`h-4 ${w}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return <p className='text-muted-foreground'>No orders found.</p>;
  }

  return (
    <Card className='border border-border bg-card text-card-foreground shadow-sm'>
      <div className='overflow-x-auto'>
        <Table className='w-full min-w-[900px] table-fixed'>
          <TableHeader className='bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground'>
            <TableRow>
              <TableHead className='p-3 w-32'>Order ID</TableHead>
              <TableHead className='p-3 w-52'>Date</TableHead>
              <TableHead className='p-3 w-64'>Email</TableHead>
              <TableHead className='p-3 w-32'>Total</TableHead>
              <TableHead className='p-3 w-32'>Payment</TableHead>
              <TableHead className='p-3 w-36'>Order Status</TableHead>
              <TableHead className='p-3 w-40'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-border'>
            {orders.map((order) => (
              <TableRow key={order._id} className='hover:bg-muted/50'>
                <TableCell className='p-3 font-semibold text-xs'>
                  {order._id.substring(0, 8)}...
                </TableCell>
                <TableCell className='p-3 text-muted-foreground'>
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className='p-3 text-muted-foreground'>{order.email}</TableCell>
                <TableCell className='p-3 font-semibold'>${order.total.toFixed(2)}</TableCell>
                <TableCell className='p-3'>
                  <Badge
                    variant={order.paymentStatus ? 'secondary' : 'destructive'}
                    className={
                      order.paymentStatus
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        : ''
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
                  <div className='flex items-center gap-4'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/my-orders/${order._id}`}
                          aria-label='View Order'
                          className='flex items-center'
                        >
                          <Eye className='size-5 text-muted-foreground hover:text-primary transition-colors align-middle' />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>Order details</TooltipContent>
                    </Tooltip>
                    {!order.paymentStatus && order.orderStatus !== 'canceled' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CreditCard
                            aria-label='Finish Payment'
                            onClick={() => handleFinishPayment(order._id)}
                            onKeyDown={(event) =>
                              handleIconKeyDown(event, () => handleFinishPayment(order._id))
                            }
                            className={`size-6 cursor-pointer align-middle text-primary transition-opacity hover:opacity-80 ${processingPayment === order._id ? 'pointer-events-none opacity-50' : ''}`}
                            style={{ verticalAlign: 'middle' }}
                            tabIndex={0}
                            role='button'
                          />
                        </TooltipTrigger>
                        <TooltipContent>Finish payment</TooltipContent>
                      </Tooltip>
                    )}
                    {!order.paymentStatus && order.orderStatus === 'placed' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <X
                            aria-label='Cancel order'
                            onClick={() => setCancelOrderId(order._id)}
                            onKeyDown={(event) =>
                              handleIconKeyDown(event, () => setCancelOrderId(order._id))
                            }
                            aria-disabled={cancelingOrder === order._id}
                            className={`size-6 cursor-pointer align-middle text-red-600 transition-colors hover:text-red-700 ${cancelingOrder === order._id ? 'pointer-events-none opacity-50' : ''}`}
                            tabIndex={cancelingOrder === order._id ? -1 : 0}
                            role='button'
                          />
                        </TooltipTrigger>
                        <TooltipContent>Cancel order</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={Boolean(cancelOrderId)}
        onOpenChange={(open) => !open && setCancelOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the unpaid order before the restaurant starts preparing it. You can place
              a new order afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(cancelingOrder)}>Keep order</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} disabled={Boolean(cancelingOrder)}>
              {cancelingOrder ? 'Canceling...' : 'Cancel order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MyOrdersTable;
