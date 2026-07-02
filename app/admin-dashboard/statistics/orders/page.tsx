'use client';

import { useEffect, useMemo, useState } from 'react';
import { redirect } from 'next/navigation';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import useProfile from '@/hooks/useProfile';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import OrdersStatisticsLoading from './loading';
import { formatAppShortDate } from '@/libs/dateFormat';

interface OrdersStatistics {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalIncome: number;
  netRevenue: number;
  averageOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  canceledOrders: number;
  cancellationRate: number;
  completionRate: number;
  paymentConversionRate: number;
  statusData: { status: string; label: string; count: number }[];
  topRestaurants: {
    restaurantId: string;
    restaurantName: string;
    orders: number;
    paidOrders: number;
    revenue: number;
  }[];
  monthlyData: { month: string; orders: number }[];
  dailyData: { date: string; orders: number }[];
}

type TimeRange = '7d' | '30d' | '3m' | '6m' | '12m';

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const OrdersStatisticsPage = () => {
  const [statistics, setStatistics] = useState<OrdersStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { loading: profileLoading, data: profileData } = useProfile();

  useEffect(() => {
    if (
      !profileLoading &&
      (profileData?.role !== 'admin' ||
        profileData?.email !== process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL)
    ) {
      redirect('/');
    }
  }, [profileLoading, profileData]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics/orders');
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        }
      } catch (error) {
        console.error('Error fetching order statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (
      profileData?.role === 'admin' &&
      profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    ) {
      fetchStatistics();
    }
  }, [profileData]);

  const filteredData = useMemo(() => {
    if (!statistics) return [];

    const now = new Date();
    let daysToShow = 30;

    switch (timeRange) {
      case '7d':
        daysToShow = 7;
        break;
      case '30d':
        daysToShow = 30;
        break;
      case '3m':
        daysToShow = 90;
        break;
      case '6m':
        daysToShow = 180;
        break;
      case '12m':
        daysToShow = 365;
        break;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);

    return statistics.dailyData
      .filter((item) => new Date(item.date) >= cutoffDate)
      .map((item) => ({
        ...item,
        displayDate: formatAppShortDate(item.date),
      }));
  }, [statistics, timeRange]);

  const chartConfig = {
    orders: {
      label: 'Orders',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  const statusChartConfig = {
    count: {
      label: 'Orders',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  if (profileLoading || loading) {
    return <OrdersStatisticsLoading />;
  }

  if (!statistics) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4'>
        <Title>Orders statistics</Title>
        <div className='mt-4 text-center'>Failed to load statistics</div>
      </section>
    );
  }

  const metricCards = [
    {
      title: 'Total Orders',
      description: 'All orders placed',
      value: statistics.totalOrders.toString(),
      tone: '',
    },
    {
      title: 'Paid Orders',
      description: 'Completed payments',
      value: statistics.paidOrders.toString(),
      tone: 'text-green-600',
    },
    {
      title: 'Active Orders',
      description: 'Kitchen and delivery queue',
      value: statistics.activeOrders.toString(),
      tone: 'text-orange-600',
    },
    {
      title: 'Canceled Orders',
      description: `${formatPercent(statistics.cancellationRate)} cancellation rate`,
      value: statistics.canceledOrders.toString(),
      tone: 'text-red-600',
    },
    {
      title: 'Total Revenue',
      description: 'Paid order total',
      value: formatCurrency(statistics.totalIncome),
      tone: 'text-green-600',
    },
    {
      title: 'Net Revenue',
      description: 'Paid revenue excluding canceled',
      value: formatCurrency(statistics.netRevenue),
      tone: 'text-green-600',
    },
    {
      title: 'Average Order',
      description: 'Average paid order value',
      value: formatCurrency(statistics.averageOrderValue),
      tone: '',
    },
    {
      title: 'Payment Rate',
      description: 'Paid orders divided by all orders',
      value: formatPercent(statistics.paymentConversionRate),
      tone: 'text-green-600',
    },
  ];

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/admin-dashboard/statistics'>Statistics</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Orders statistics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Orders statistics</Title>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-6'>
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.tone}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-6 lg:grid-cols-2 mt-8'>
        <Card>
          <CardHeader>
            <CardTitle>Order status breakdown</CardTitle>
            <CardDescription>Current lifecycle distribution across all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className='h-[320px] w-full'>
              <BarChart
                data={statistics.statusData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey='count' fill='var(--color-count)' radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top restaurant revenue</CardTitle>
            <CardDescription>Restaurants ranked by paid order revenue</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {statistics.topRestaurants.length > 0 ? (
              statistics.topRestaurants.map((restaurant) => (
                <div
                  key={restaurant.restaurantId}
                  className='flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{restaurant.restaurantName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {restaurant.orders} orders, {restaurant.paidOrders} paid
                    </p>
                  </div>
                  <p className='shrink-0 font-semibold'>{formatCurrency(restaurant.revenue)}</p>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No restaurant revenue yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Orders Over Time</CardTitle>
              <CardDescription>Track order trends across different ranges</CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['7d', '30d', '3m', '6m', '12m'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {range === '7d' && 'Last 7 Days'}
                  {range === '30d' && 'Last 30 Days'}
                  {range === '3m' && 'Last 3 Months'}
                  {range === '6m' && 'Last 6 Months'}
                  {range === '12m' && 'Last 12 Months'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-[400px] w-full'>
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id='fillOrders' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-orders)' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='var(--color-orders)' stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='displayDate'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={timeRange === '7d' ? 0 : 'preserveStartEnd'}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type='monotone'
                dataKey='orders'
                stroke='var(--color-orders)'
                fill='url(#fillOrders)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Orders Per Month</CardTitle>
          <CardDescription>Last 12 months distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-[400px] w-full'>
            <BarChart
              data={statistics.monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='month'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor='end'
                height={80}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='orders' fill='var(--color-orders)' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
};

export default OrdersStatisticsPage;
