'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import Title from '@/components/shared/Title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';

type QueueOrder = {
  _id: string;
  email: string;
  phone: string;
  total: number;
  paymentStatus: boolean;
  orderStatus: 'placed' | 'processing' | 'ready' | 'transportation' | 'delivered';
  courierAssignmentStatus?: 'pending' | 'accepted' | 'declined' | null;
  minutesSincePlaced: number;
  isLateBeforeTransport: boolean;
  isReadyWithoutCourierLate?: boolean;
  cartProducts: Array<{ name: string; quantity: number; size: string }>;
  courierId?: { name: string; email: string } | null;
};

const columns: Array<{ status: QueueOrder['orderStatus']; title: string }> = [
  { status: 'placed', title: 'Placed' },
  { status: 'processing', title: 'Processing' },
  { status: 'ready', title: 'Ready' },
  { status: 'transportation', title: 'Out for delivery' },
  { status: 'delivered', title: 'Awaiting confirmation' },
];

const OrderQueuePage = () => {
  const { data: profileData, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = profileData?.role === 'admin';

  const fetchQueue = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const response = await fetch('/api/orders/queue', { cache: 'no-store' });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to load order queue');
      }

      setOrders(Array.isArray(json.orders) ? json.orders : []);
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to load order queue');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!profileLoading && isAdmin) {
      void fetchQueue();
      const interval = setInterval(fetchQueue, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchQueue, isAdmin, profileLoading]);

  const groupedOrders = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [
          column.status,
          orders.filter((order) => order.orderStatus === column.status),
        ])
      ) as Record<QueueOrder['orderStatus'], QueueOrder[]>,
    [orders]
  );

  if (profileLoading || loading) {
    return (
      <section className='space-y-6'>
        <Skeleton className='h-10 w-64' />
        <div className='grid gap-4 xl:grid-cols-5'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-72 rounded-lg' />
          ))}
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return <p className='text-sm text-muted-foreground'>Only admins can view the order queue.</p>;
  }

  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Title>Order Queue</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Track active orders from kitchen intake through courier handoff.
          </p>
        </div>
        <Button type='button' variant='outline' onClick={() => fetchQueue()} className='gap-2'>
          <RefreshCw className='size-4' />
          Refresh
        </Button>
      </div>

      <div className='grid gap-4 xl:grid-cols-5'>
        {columns.map((column) => (
          <Card key={column.status} className='min-h-72'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-base'>
                {column.title}
                <Badge variant='secondary'>{groupedOrders[column.status].length}</Badge>
              </CardTitle>
              <CardDescription>Current stage</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {groupedOrders[column.status].length === 0 ? (
                <p className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
                  No orders
                </p>
              ) : (
                groupedOrders[column.status].map((order) => (
                  <div key={order._id} className='rounded-lg border p-3 text-sm'>
                    <div className='mb-2 flex items-start justify-between gap-2'>
                      <div>
                        <p className='font-semibold'>#{order._id.slice(-8).toUpperCase()}</p>
                        <p className='text-muted-foreground'>{order.email}</p>
                      </div>
                      {order.isLateBeforeTransport && (
                        <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
                          <AlertTriangle className='mr-1 size-3' />
                          {order.isReadyWithoutCourierLate ? 'No courier' : 'Late'}
                        </Badge>
                      )}
                    </div>
                    <p className='text-muted-foreground'>{order.minutesSincePlaced} min active</p>
                    {order.courierAssignmentStatus && (
                      <p className='mt-1 capitalize'>
                        Courier: {order.courierAssignmentStatus.replace('_', ' ')}
                      </p>
                    )}
                    <p className='mt-2 font-medium'>${Number(order.total || 0).toFixed(2)}</p>
                    <Button asChild variant='outline' size='sm' className='mt-3 w-full gap-2'>
                      <Link href={`/admin-dashboard/orders/${order._id}`}>
                        <ExternalLink className='size-4' />
                        Open
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default OrderQueuePage;
