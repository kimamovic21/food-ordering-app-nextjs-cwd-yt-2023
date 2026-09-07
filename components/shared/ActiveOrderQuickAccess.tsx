'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock3, CreditCard, Truck } from 'lucide-react';
import { queryKeys } from '@/libs/queryKeys';
import { getOrderDelayNotice } from '@/libs/orderDelay';
import { cn } from '@/libs/utils';
import type { OrderStatus } from '@/types/order';

type ActiveOrder = {
  _id: string;
  orderStatus: OrderStatus;
  paymentStatus: boolean;
  createdAt: string | null;
  estimatedTotalMinutes?: number | null;
};

type ActiveOrderQuickAccessProps = {
  isAuthenticated: boolean;
  userRole?: string | null;
  onNavigate?: () => void;
  className?: string;
};

const fetchActiveOrder = async (): Promise<ActiveOrder | null> => {
  const response = await fetch('/api/my-orders/active', { cache: 'no-store' });
  const json = await response.json().catch(() => null);

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to load active order.');
  }

  return json?.order ?? null;
};

const statusLabels: Partial<Record<OrderStatus, string>> = {
  placed: 'Placed',
  processing: 'In kitchen',
  ready: 'Ready',
  transportation: 'On the way',
  delivered: 'Confirm delivery',
};

const ActiveOrderQuickAccess = ({
  isAuthenticated,
  userRole,
  onNavigate,
  className,
}: ActiveOrderQuickAccessProps) => {
  const pathname = usePathname();
  const isCustomer = userRole === 'user';
  const shouldFetch =
    isAuthenticated &&
    isCustomer &&
    !pathname?.startsWith('/admin-dashboard') &&
    !pathname?.startsWith('/courier-dashboard');

  const { data: order } = useQuery({
    queryKey: queryKeys.orders.active(),
    queryFn: fetchActiveOrder,
    enabled: shouldFetch,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (!shouldFetch || !order?._id || pathname === `/my-orders/${order._id}`) {
    return null;
  }

  const delayNotice = getOrderDelayNotice({
    createdAt: order.createdAt,
    orderStatus: order.orderStatus,
    estimatedTotalMinutes: order.estimatedTotalMinutes,
  });
  const isPaymentPending = !order.paymentStatus;
  const Icon = isPaymentPending ? CreditCard : delayNotice ? Clock3 : Truck;

  return (
    <Link
      href={`/my-orders/${order._id}`}
      onClick={onNavigate}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
        isPaymentPending
          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
          : delayNotice
            ? 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200'
            : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200',
        className
      )}
    >
      <Icon className='size-4' aria-hidden='true' />
      <span className='whitespace-nowrap'>
        {isPaymentPending ? 'Finish payment' : delayNotice ? 'Order delayed' : 'Track order'}
      </span>
      {!isPaymentPending && !delayNotice && (
        <span className='hidden text-xs opacity-80 xl:inline'>
          {statusLabels[order.orderStatus] || 'Active'}
        </span>
      )}
    </Link>
  );
};

export default ActiveOrderQuickAccess;
