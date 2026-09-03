'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Package,
  Star,
  Timer,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import useProfile from '@/hooks/useProfile';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import MyDeliveriesLoading from './loading';
import { formatAppDate } from '@/libs/dateFormat';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { CourierPerformanceSummary, EarningsChartItem } from '@/types/courier';
import type { DeliveredOrder } from '@/types/order';

const earningsChartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
};

const INITIAL_VISIBLE_ORDERS = 9;
const ORDERS_INCREMENT = 9;

const MyDeliveriesPage = () => {
  const router = useRouter();
  const { data: profileData, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [summary, setSummary] = useState<CourierPerformanceSummary>({
    completedDeliveries: 0,
    totalAssignments: 0,
    acceptedAssignments: 0,
    respondedAssignments: 0,
    declinedAssignments: 0,
    missedAssignments: 0,
    lateDeliveries: 0,
    totalEarnings: 0,
    averageEarning: 0,
    averageDeliveryMinutes: 0,
    averageResponseMinutes: 0,
    assignmentResponseRate: 0,
    assignmentAcceptanceRate: 0,
    averageRating: 0,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [earningsChart, setEarningsChart] = useState<EarningsChartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibleOrders, setVisibleOrders] = useState(INITIAL_VISIBLE_ORDERS);

  useEffect(() => {
    if (profileLoading) return;

    if (profileData?.role !== 'courier') {
      router.replace('/');
      setLoading(false);
      return;
    }

    const fetchDeliveredOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/my-deliveries');
        if (!res.ok) {
          throw new Error('Failed to fetch delivered orders');
        }
        const data = await res.json();
        setOrders(data.orders);
        setSummary({
          completedDeliveries: Number(data.summary?.completedDeliveries) || 0,
          totalAssignments: Number(data.summary?.totalAssignments) || 0,
          acceptedAssignments: Number(data.summary?.acceptedAssignments) || 0,
          respondedAssignments: Number(data.summary?.respondedAssignments) || 0,
          declinedAssignments: Number(data.summary?.declinedAssignments) || 0,
          missedAssignments: Number(data.summary?.missedAssignments) || 0,
          lateDeliveries: Number(data.summary?.lateDeliveries) || 0,
          totalEarnings: Number(data.summary?.totalEarnings) || 0,
          averageEarning: Number(data.summary?.averageEarning) || 0,
          averageDeliveryMinutes: Number(data.summary?.averageDeliveryMinutes) || 0,
          averageResponseMinutes: Number(data.summary?.averageResponseMinutes) || 0,
          assignmentResponseRate: Number(data.summary?.assignmentResponseRate) || 0,
          assignmentAcceptanceRate: Number(data.summary?.assignmentAcceptanceRate) || 0,
          averageRating: Number(data.summary?.averageRating) || 0,
          ratingCount: Number(data.summary?.ratingCount) || 0,
        });
        setEarningsChart(Array.isArray(data.earningsChart) ? data.earningsChart : []);
        setVisibleOrders(INITIAL_VISIBLE_ORDERS);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, [profileData?.role, profileLoading, router]);

  if (profileLoading) {
    return <MyDeliveriesLoading />;
  }

  if (profileData?.role !== 'courier') {
    return null;
  }

  if (loading) {
    return <MyDeliveriesLoading />;
  }

  const hasMoreOrders = orders.length > visibleOrders;
  const displayedOrders = orders.slice(0, visibleOrders);
  const performanceCards = [
    {
      label: 'Total earnings',
      value: `$${summary.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: 'Average earning',
      value: `$${summary.averageEarning.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: 'Completed deliveries',
      value: summary.completedDeliveries.toString(),
      icon: Package,
    },
    {
      label: 'Average delivery time',
      value: summary.averageDeliveryMinutes ? `${summary.averageDeliveryMinutes} min` : '-',
      icon: Clock,
    },
    {
      label: 'Average rating',
      value: summary.ratingCount ? `${summary.averageRating.toFixed(1)} / 5` : 'No ratings',
      icon: Star,
    },
    {
      label: 'Response rate',
      value: summary.totalAssignments ? `${summary.assignmentResponseRate}%` : '-',
      icon: CheckCircle2,
    },
    {
      label: 'Average response time',
      value: summary.averageResponseMinutes ? `${summary.averageResponseMinutes} min` : '-',
      icon: Timer,
    },
    {
      label: 'Accepted assignments',
      value: summary.acceptedAssignments.toString(),
      icon: CheckCircle2,
    },
    {
      label: 'Declined assignments',
      value: summary.declinedAssignments.toString(),
      icon: XCircle,
    },
    {
      label: 'Missed assignments',
      value: summary.missedAssignments.toString(),
      icon: AlertTriangle,
    },
    {
      label: 'Late deliveries',
      value: summary.lateDeliveries.toString(),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <Title className='mb-8'>My Deliveries</Title>

      <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {performanceCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label}>
              <CardContent className='flex items-center gap-3 p-4'>
                <span className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <Icon className='size-5' />
                </span>
                <div>
                  <p className='text-xs text-muted-foreground'>{card.label}</p>
                  <p className='text-lg font-semibold'>{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Earnings by month</CardTitle>
        </CardHeader>
        <CardContent>
          {earningsChart.length > 0 ? (
            <ChartContainer config={earningsChartConfig} className='h-[280px] w-full'>
              <BarChart data={earningsChart} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey='month' tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey='earnings' fill='var(--color-earnings)' radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className='py-10 text-center text-sm text-muted-foreground'>
              Earnings chart appears after your first completed delivery.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Assignment reliability</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div className='rounded-lg border p-4'>
            <p className='text-sm text-muted-foreground'>Response rate</p>
            <p className='mt-2 text-3xl font-bold'>
              {summary.totalAssignments ? `${summary.assignmentResponseRate}%` : 'No data'}
            </p>
            <div className='mt-3 h-2 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-green-600'
                style={{ width: `${Math.min(100, summary.assignmentResponseRate)}%` }}
              />
            </div>
          </div>
          <div className='rounded-lg border p-4'>
            <p className='text-sm text-muted-foreground'>Assignment responses</p>
            <p className='mt-2 text-3xl font-bold'>{summary.respondedAssignments}</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {summary.acceptedAssignments} accepted, {summary.declinedAssignments} declined.
            </p>
          </div>
          <div className='rounded-lg border p-4'>
            <p className='text-sm text-muted-foreground'>Missed assignments</p>
            <p className='mt-2 text-3xl font-bold'>{summary.missedAssignments}</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Assignments that expired without your response.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6'>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className='text-center py-12'>
          <Package className='mx-auto h-12 w-12 text-gray-400 mb-4' />
          <p className='text-muted-foreground'>No completed deliveries yet.</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {displayedOrders.map((order) => (
              <Link
                key={order._id}
                href={`/my-deliveries/${order._id}`}
                className='transition-transform hover:scale-105'
              >
                <Card className='cursor-pointer hover:shadow-lg h-full'>
                  <CardHeader>
                    <CardTitle className='space-y-3'>
                      <span className='block text-lg'>
                        Order #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className='inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200'>
                        Delivered
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-start gap-2'>
                      <MapPin className='h-4 w-4 mt-1 text-muted-foreground shrink-0' />
                      <div className='text-sm'>
                        <p className='font-medium'>Delivery Address:</p>
                        <p className='text-muted-foreground'>
                          {order.streetAddress}, {order.city}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <div className='text-sm'>
                        <p className='text-muted-foreground'>{formatAppDate(order.updatedAt)}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <DollarSign className='h-4 w-4 text-muted-foreground' />
                      <div className='text-sm'>
                        <p className='font-medium'>
                          ${(Number(order.deliveryFee) || 0).toFixed(2)} earned
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Package className='h-4 w-4 text-muted-foreground' />
                      <div className='text-sm'>
                        <p className='text-muted-foreground'>{order.cartProducts.length} item(s)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMoreOrders && (
            <div className='mt-8 flex justify-center'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setVisibleOrders((current) => current + ORDERS_INCREMENT)}
              >
                Show more orders
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDeliveriesPage;
