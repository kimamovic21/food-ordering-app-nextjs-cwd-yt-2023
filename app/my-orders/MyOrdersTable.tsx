'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type KeyboardEvent } from 'react';
import { CreditCard, Eye, Loader2, RefreshCcw, X } from 'lucide-react';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCart } from '@/contexts/CartContext';
import { formatAppDateTime } from '@/libs/dateFormat';
import type { OrderListItem } from '@/types/order';

type MyOrdersTableProps = {
  orders: OrderListItem[];
  loading: boolean;
  onOrderUpdated?: (order: OrderListItem) => void;
};

type PaymentLinkResponse = {
  error?: string;
  message?: string;
  paid?: boolean;
  paymentLinkStatus?: 'created' | 'reused' | 'refreshed';
  url?: string;
};

const columnHelper = createDataTableColumnHelper<OrderListItem>();

function PaymentBadge({ paid }: { paid: boolean }) {
  return (
    <Badge
      variant={paid ? 'secondary' : 'destructive'}
      className={paid ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}
    >
      {paid ? 'Paid' : 'Unpaid'}
    </Badge>
  );
}

function OrderStatusBadge({ status }: { status: OrderListItem['orderStatus'] }) {
  const statusClassName =
    status === 'canceled'
      ? 'bg-red-100 text-red-800 hover:bg-red-100'
      : status === 'completed'
        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
        : status === 'processing'
          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
          : 'bg-amber-100 text-amber-800 hover:bg-amber-100';

  return (
    <Badge variant='secondary' className={`${statusClassName} capitalize`}>
      {status}
    </Badge>
  );
}

const orderColumnLabels = {
  actions: 'Action',
  createdAt: 'Date',
  email: 'Email',
  orderId: 'Order ID',
  orderStatus: 'Order Status',
  paymentStatus: 'Payment',
  total: 'Total',
};

const MyOrdersTable = ({ orders, loading, onOrderUpdated }: MyOrdersTableProps) => {
  const router = useRouter();
  const { replaceCart } = useCart();
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [reorderingOrder, setReorderingOrder] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);

  const handleFinishPayment = async (orderId: string) => {
    if (processingPayment) return;

    let redirectingToCheckout = false;

    try {
      setProcessingPayment(orderId);
      const res = await fetch(`/api/payment-link?orderId=${orderId}`);
      const data = (await res.json().catch(() => ({}))) as PaymentLinkResponse;

      if (!res.ok) {
        sonnerToast.error(data.error || 'Failed to get payment link');
        return;
      }

      if (data.paid) {
        const currentOrder = orders.find((order) => order._id === orderId);
        if (currentOrder) {
          onOrderUpdated?.({
            ...currentOrder,
            paymentStatus: true,
          });
        } else {
          router.refresh();
        }
        sonnerToast.success(data.message || 'Payment completed');
        return;
      }

      if (data.url) {
        redirectingToCheckout = true;

        if (data.paymentLinkStatus === 'refreshed') {
          sonnerToast.info('Previous payment link expired. Opening a fresh checkout.');
          window.setTimeout(() => {
            window.location.assign(data.url as string);
          }, 700);
          return;
        }

        window.location.assign(data.url);
        return;
      }

      sonnerToast.error('Payment link not available');
    } catch (error) {
      console.error('Error fetching payment link:', error);
      sonnerToast.error('Failed to get payment link');
    } finally {
      if (!redirectingToCheckout) {
        setProcessingPayment(null);
      }
    }
  };

  const handleIconKeyDown = (event: KeyboardEvent<SVGSVGElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      setReorderingOrder(orderId);
      const res = await fetch('/api/my-orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reorder');
      }

      replaceCart(data.cartItems || []);
      sonnerToast.success('Order added to cart');
      router.push('/cart');
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to reorder');
    } finally {
      setReorderingOrder(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      setCancelingOrder(cancelOrderId);
      const res = await fetch('/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancelOrderId,
          action: 'cancel-order',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      onOrderUpdated?.(data.order);
      setCancelOrderId(null);
      sonnerToast.success('Order canceled. The old payment link is no longer valid.');
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setCancelingOrder(null);
    }
  };

  const ordersTableColumns = columnHelper.columns([
    columnHelper.accessor((order) => order._id, {
      id: 'orderId',
      header: 'Order ID',
      cell: ({ row }) => (
        <span className='font-mono text-xs font-semibold text-muted-foreground'>
          {row.original._id.substring(0, 8)}...
        </span>
      ),
    }),
    columnHelper.accessor((order) => new Date(order.createdAt).getTime(), {
      id: 'createdAt',
      header: 'Date',
      sortDescFirst: true,
      cell: ({ row }) => (
        <span className='text-muted-foreground'>{formatAppDateTime(row.original.createdAt)}</span>
      ),
    }),
    columnHelper.accessor((order) => order.email, {
      id: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className='text-muted-foreground'>{getValue()}</span>,
    }),
    columnHelper.accessor((order) => order.total, {
      id: 'total',
      header: 'Total',
      sortDescFirst: true,
      cell: ({ getValue }) => <span className='font-semibold'>${getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor((order) => (order.paymentStatus ? 'Paid' : 'Unpaid'), {
      id: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => <PaymentBadge paid={row.original.paymentStatus} />,
    }),
    columnHelper.accessor((order) => order.orderStatus, {
      id: 'orderStatus',
      header: 'Order Status',
      cell: ({ row }) => <OrderStatusBadge status={row.original.orderStatus} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className='flex items-center gap-4'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/my-orders/${order._id}`}
                  aria-label='View Order'
                  className='flex items-center'
                >
                  <Eye className='size-5 align-middle text-muted-foreground transition-colors hover:text-primary' />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Order details</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <RefreshCcw
                  aria-label='Reorder'
                  onClick={() => handleReorder(order._id)}
                  onKeyDown={(event) => handleIconKeyDown(event, () => handleReorder(order._id))}
                  aria-disabled={reorderingOrder === order._id}
                  className={`size-5 cursor-pointer align-middle text-muted-foreground transition-colors hover:text-primary ${reorderingOrder === order._id ? 'pointer-events-none opacity-50' : ''}`}
                  tabIndex={reorderingOrder === order._id ? -1 : 0}
                  role='button'
                />
              </TooltipTrigger>
              <TooltipContent>Reorder</TooltipContent>
            </Tooltip>

            {!order.paymentStatus && order.orderStatus !== 'canceled' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    aria-label='Finish Payment'
                    aria-busy={processingPayment === order._id}
                    disabled={Boolean(processingPayment)}
                    onClick={() => handleFinishPayment(order._id)}
                    className='inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-primary transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {processingPayment === order._id ? (
                      <Loader2 className='size-5 animate-spin' />
                    ) : (
                      <CreditCard className='size-5' />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {processingPayment === order._id ? 'Opening checkout...' : 'Finish payment'}
                </TooltipContent>
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
        );
      },
      enableGlobalFilter: false,
      enableHiding: false,
      enableSorting: false,
    }),
  ]) satisfies DataTableColumnDef<OrderListItem>[];

  if (loading) {
    return (
      <Card className='border border-border bg-card text-card-foreground shadow-sm'>
        <div className='p-4'>
          <Skeleton className='mb-4 h-8 w-48' />
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
                  {['w-24', 'w-40', 'w-64', 'w-24', 'w-20', 'w-28', 'w-32'].map((w, cellIdx) => (
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

  return (
    <>
      <TanStackDataTable
        columns={ordersTableColumns}
        data={orders}
        tableKey='my-orders'
        searchPlaceholder='Search orders by ID, email, status, or payment...'
        emptyMessage='No orders found.'
        initialSorting={[{ id: 'createdAt', desc: true }]}
        minWidthClassName='min-w-[900px]'
        columnLabels={orderColumnLabels}
      />

      <AlertDialog
        open={Boolean(cancelOrderId)}
        onOpenChange={(open) => {
          if (cancelingOrder) return;
          if (!open) setCancelOrderId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the unpaid order before the restaurant starts preparing it and
              invalidates the old Stripe checkout link. You can place a new order afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(cancelingOrder)}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleCancelOrder();
              }}
              disabled={Boolean(cancelingOrder)}
            >
              {cancelingOrder ? 'Canceling...' : 'Cancel order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyOrdersTable;
