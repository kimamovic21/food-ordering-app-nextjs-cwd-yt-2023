'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';
import { Badge } from '@/components/ui/badge';
import { formatAppDateTime } from '@/libs/dateFormat';
import type { OrderListItem } from '@/types/order';

type OrdersTableProps = {
  orders: OrderListItem[];
  loading: boolean;
};

const columnHelper = createDataTableColumnHelper<OrderListItem>();

function PaymentBadge({ paid }: { paid: boolean }) {
  return (
    <Badge
      variant={paid ? 'default' : 'destructive'}
      className={
        paid
          ? 'bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-gray-950 dark:hover:bg-emerald-500'
          : 'bg-red-600 text-white hover:bg-red-600 dark:bg-red-500 dark:text-gray-950 dark:hover:bg-red-500'
      }
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
    cell: ({ row }) => (
      <Link
        href={`/admin-dashboard/orders/${row.original._id}`}
        aria-label='View order details'
        className='inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary'
      >
        <Eye className='size-5' aria-hidden='true' />
      </Link>
    ),
    enableGlobalFilter: false,
    enableHiding: false,
    enableSorting: false,
  }),
]) satisfies DataTableColumnDef<OrderListItem>[];

const orderColumnLabels = {
  actions: 'Action',
  createdAt: 'Date',
  email: 'Email',
  orderId: 'Order ID',
  orderStatus: 'Order Status',
  paymentStatus: 'Payment',
  total: 'Total',
};

const OrdersTable = ({ orders, loading }: OrdersTableProps) => {
  if (loading) {
    return <p className='text-gray-600 dark:text-gray-400'>Loading orders...</p>;
  }

  return (
    <TanStackDataTable
      columns={ordersTableColumns}
      data={orders}
      tableKey='admin-orders'
      searchPlaceholder='Search orders by ID, email, status, or payment...'
      emptyMessage='No orders found.'
      initialSorting={[{ id: 'createdAt', desc: true }]}
      minWidthClassName='min-w-[900px]'
      columnLabels={orderColumnLabels}
    />
  );
};

export default OrdersTable;
