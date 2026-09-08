'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock3,
  DollarSign,
  type LucideIcon,
  RefreshCw,
  ShoppingCart,
  Truck,
  Utensils,
} from 'lucide-react';
import Title from '@/components/shared/Title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useProfile from '@/hooks/useProfile';
import { formatAppTime } from '@/libs/dateFormat';
import { formatMoney } from '@/libs/money';
import { queryKeys } from '@/libs/queryKeys';
import {
  APP_NOTIFICATION_REALTIME_EVENT,
  getNotificationRealtimePayload,
  isOrderRelatedRealtimePayload,
} from '@/libs/realtimeClient';
import { cn } from '@/libs/utils';
import type {
  RestaurantOperationsAttentionOrder,
  RestaurantOperationsOverview,
  RestaurantOperationsTone,
} from '@/types/operations';

type OperationsResponse = {
  operations?: RestaurantOperationsOverview;
  error?: string;
};

const toneBadgeClassName: Record<RestaurantOperationsTone, string> = {
  success:
    'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  danger:
    'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200',
  neutral:
    'border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground',
};

const tonePanelClassName: Record<RestaurantOperationsTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20',
  danger: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
  neutral: 'border-border bg-muted/30',
};

const fetchOperations = async () => {
  const response = await fetch('/api/restaurant/operations', { cache: 'no-store' });
  const json = (await response.json().catch(() => ({}))) as OperationsResponse;

  if (response.status === 403) {
    return null;
  }

  if (!response.ok || !json.operations) {
    throw new Error(json.error || 'Failed to load restaurant operations.');
  }

  return json.operations;
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: RestaurantOperationsTone;
}) {
  return (
    <Card className='gap-4'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div
          className={cn(
            'rounded-lg border p-2',
            tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
            tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
            tone === 'danger' && 'border-red-200 bg-red-50 text-red-700',
            tone === 'neutral' && 'border-border bg-muted text-muted-foreground'
          )}
        >
          <Icon className='size-4' />
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-semibold tracking-tight'>{value}</p>
        <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  );
}

function OperationsLoading() {
  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-9 w-56' />
          <Skeleton className='h-4 w-80' />
        </div>
        <Skeleton className='h-10 w-28' />
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className='h-32 rounded-xl' />
        ))}
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
        <Skeleton className='h-80 rounded-xl' />
        <Skeleton className='h-80 rounded-xl' />
      </div>
    </section>
  );
}

function getAttentionOrderAction(order: RestaurantOperationsAttentionOrder) {
  const reason = order.reason.toLowerCase();

  if (reason.includes('failed delivery')) {
    return {
      href: `/admin-dashboard/orders/${order._id}`,
      label: 'Review cancellation',
    };
  }

  if (reason.includes('courier') || order.orderStatus === 'ready') {
    return {
      href: `/admin-dashboard/orders/${order._id}`,
      label: 'Assign courier',
    };
  }

  if (reason.includes('payment')) {
    return {
      href: `/admin-dashboard/orders/${order._id}`,
      label: 'Review payment',
    };
  }

  return {
    href: `/admin-dashboard/orders/${order._id}`,
    label: 'Open order',
  };
}

function AttentionOrderRow({ order }: { order: RestaurantOperationsAttentionOrder }) {
  const action = getAttentionOrderAction(order);

  return (
    <div className='flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <Link
            href={`/admin-dashboard/orders/${order._id}`}
            className='font-semibold hover:text-primary hover:underline'
          >
            #{order._id.slice(-8).toUpperCase()}
          </Link>
          <Badge variant='outline' className={toneBadgeClassName[order.tone]}>
            {order.reason}
          </Badge>
        </div>
        <p className='mt-1 truncate text-sm text-muted-foreground'>{order.email}</p>
        <p className='mt-2 text-sm'>{order.description}</p>
      </div>
      <div className='flex shrink-0 items-center gap-3 text-sm sm:text-right'>
        <div>
          <p className='font-semibold'>{order.minutesSincePlaced} min</p>
          <p className='capitalize text-muted-foreground'>{order.orderStatus}</p>
        </div>
        <Button asChild variant={order.tone === 'danger' ? 'default' : 'outline'} size='sm'>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function RestaurantOperationsPage() {
  const { data: profileData, loading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const isAdmin = profileData?.role === 'admin';

  const {
    data: operations,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.restaurantOperations.overview(),
    queryFn: fetchOperations,
    enabled: Boolean(isAdmin),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const handleRealtimeOrderUpdate = (event: Event) => {
      const payload = getNotificationRealtimePayload(event);

      if (isOrderRelatedRealtimePayload(payload)) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.restaurantOperations.overview(),
        });
      }
    };

    window.addEventListener(APP_NOTIFICATION_REALTIME_EVENT, handleRealtimeOrderUpdate);

    return () => {
      window.removeEventListener(APP_NOTIFICATION_REALTIME_EVENT, handleRealtimeOrderUpdate);
    };
  }, [queryClient]);

  if (profileLoading || isLoading) {
    return <OperationsLoading />;
  }

  if (!isAdmin) {
    return <p className='text-sm text-muted-foreground'>Only admins can view operations.</p>;
  }

  if (operations === null) {
    return (
      <section className='space-y-6'>
        <Title>Operations</Title>
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <p className='font-semibold'>No restaurant connected</p>
            <p className='text-sm text-muted-foreground'>
              Create or connect a restaurant before opening the operations overview.
            </p>
            <Button asChild>
              <Link href='/admin-dashboard/restaurant'>Open restaurant settings</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isError || !operations) {
    return (
      <section className='space-y-6'>
        <Title>Operations</Title>
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <p className='font-semibold'>Operations could not load</p>
            <p className='text-sm text-muted-foreground'>
              {error instanceof Error ? error.message : 'Please refresh and try again.'}
            </p>
            <Button type='button' variant='outline' onClick={() => refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const maxStageCount = Math.max(...operations.stageCounts.map((item) => item.count), 1);
  const restaurantTone = operations.restaurant.status.tone;

  return (
    <section className='space-y-6 pb-10'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <Title>Operations</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Live restaurant control center for orders, capacity, couriers, and today&apos;s sales.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='outline' className={toneBadgeClassName[restaurantTone]}>
            {operations.restaurant.status.statusLabel}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            Updated {formatAppTime(operations.updatedAt)}
          </span>
          <Button
            type='button'
            variant='outline'
            onClick={() => refetch()}
            disabled={isFetching}
            className='gap-2'
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Active now'
          value={operations.stageCounts.reduce((sum, item) => sum + item.count, 0).toString()}
          description='Orders still moving through the restaurant flow'
          icon={ShoppingCart}
          tone={operations.stageCounts.some((item) => item.count > 0) ? 'warning' : 'neutral'}
        />
        <MetricCard
          title='Today revenue'
          value={formatMoney(operations.today.revenue)}
          description={`${operations.today.paidOrders} paid orders on ${operations.today.label}`}
          icon={DollarSign}
          tone={operations.today.revenue > 0 ? 'success' : 'neutral'}
        />
        <MetricCard
          title='Available couriers'
          value={operations.couriers.availableCouriers.toString()}
          description={`${operations.couriers.totalCouriers} total courier profiles`}
          icon={Truck}
          tone={operations.couriers.availableCouriers > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          title='Needs attention'
          value={operations.attentionOrders.length.toString()}
          description={`Late threshold is ${operations.lateThresholdMinutes} minutes`}
          icon={AlertTriangle}
          tone={operations.attentionOrders.length > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title='Today orders'
          value={operations.today.totalOrders.toString()}
          description={`${operations.today.activeOrders} active, ${operations.today.completedOrders} completed`}
          icon={ChefHat}
        />
        <MetricCard
          title='Average order'
          value={formatMoney(operations.today.averageOrderValue)}
          description='Average paid order value today'
          icon={Clock3}
        />
        <MetricCard
          title='Unpaid today'
          value={operations.today.unpaidOrders.toString()}
          description='Checkout attempts not paid yet'
          icon={AlertTriangle}
          tone={operations.today.unpaidOrders > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title='Canceled today'
          value={operations.today.canceledOrders.toString()}
          description="Orders canceled during today's period"
          icon={CheckCircle2}
          tone={operations.today.canceledOrders > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Current Order Stages</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {operations.stageCounts.map((item) => (
              <div key={item.status} className='space-y-2'>
                <div className='flex items-center justify-between gap-4 text-sm'>
                  <span className='font-medium'>{item.label}</span>
                  <span className='text-muted-foreground'>{item.count}</span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary transition-all'
                    style={{ width: `${(item.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cn('gap-4', tonePanelClassName[restaurantTone])}>
          <CardHeader>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle>{operations.restaurant.name}</CardTitle>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {operations.restaurant.status.statusMessage}
                </p>
              </div>
              <Utensils className='size-5 shrink-0 text-muted-foreground' />
            </div>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div>
              <div className='mb-2 flex items-center justify-between text-sm'>
                <span className='font-medium'>Kitchen capacity</span>
                <span className='text-muted-foreground'>
                  {operations.restaurant.activeKitchenOrders}/
                  {operations.restaurant.activeOrderLimit}
                </span>
              </div>
              <div className='h-3 overflow-hidden rounded-full bg-background/80'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    operations.restaurant.isAtCapacity
                      ? 'bg-red-500'
                      : operations.restaurant.isNearCapacity
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  )}
                  style={{ width: `${operations.restaurant.capacityUsagePercent}%` }}
                />
              </div>
              {operations.restaurant.shouldSuggestPause && (
                <p className='mt-2 text-xs font-medium text-amber-700 dark:text-amber-200'>
                  Close to capacity. Pause checkout if the kitchen needs breathing room.
                </p>
              )}
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border border-border bg-background/60 p-3'>
                <p className='text-xs text-muted-foreground'>Accepting checkout</p>
                <p className='mt-1 font-semibold'>
                  {operations.restaurant.status.isAcceptingOrders ? 'Yes' : 'No'}
                </p>
              </div>
              <div className='rounded-lg border border-border bg-background/60 p-3'>
                <p className='text-xs text-muted-foreground'>Courier coverage</p>
                <p className='mt-1 font-semibold'>
                  {operations.couriers.availableCouriers} available
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Button asChild>
                <Link href='/admin-dashboard/order-queue'>Open order queue</Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/admin-dashboard/orders'>All orders</Link>
              </Button>
              <Button
                asChild
                variant={operations.restaurant.shouldSuggestPause ? 'default' : 'outline'}
              >
                <Link href='/admin-dashboard/restaurant'>Restaurant settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>Needs Attention</CardTitle>
              <p className='mt-2 text-sm text-muted-foreground'>
                Orders that may block kitchen flow, courier handoff, or customer confirmation.
              </p>
            </div>
            <Button asChild variant='outline' size='sm'>
              <Link href='/admin-dashboard/orders'>All orders</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {operations.attentionOrders.length > 0 ? (
            operations.attentionOrders.map((order) => (
              <AttentionOrderRow key={order._id} order={order} />
            ))
          ) : (
            <div className='rounded-lg border border-dashed border-border p-6 text-center'>
              <p className='font-medium'>Nothing urgent right now</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Active orders are within expected timing and assignment rules.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
