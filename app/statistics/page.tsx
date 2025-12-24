'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import useProfile from '@/contexts/UseProfile';
import Title from '@/components/shared/Title';

interface StatisticsData {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalIncome: number;
  totalUsers: number;
  monthlyData: { month: string; orders: number }[];
  dailyData: { date: string; orders: number }[];
}

type TimeRange = '7d' | '30d' | '3m' | '6m' | '12m';

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { loading: profileLoading, data: profileData } = useProfile();

  useEffect(() => {
    if (!profileLoading && !profileData?.admin) {
      redirect('/');
    }
  }, [profileLoading, profileData]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics');
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profileData?.admin) {
      fetchStatistics();
    }
  }, [profileData]);

  if (profileLoading || loading) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4'>
        <Title>Statistics</Title>
        <div className='mt-8 text-center'>Loading...</div>
      </section>
    );
  }

  if (!statistics) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4'>
        <Title>Statistics</Title>
        <div className='mt-8 text-center'>Failed to load statistics</div>
      </section>
    );
  }

  // Filter daily data based on selected time range
  const getFilteredData = () => {
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
        displayDate: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
  };

  const filteredData = getFilteredData();

  const areaChartConfig = {
    orders: {
      label: 'Orders',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  const barChartConfig = {
    orders: {
      label: 'Orders',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Title>Statistics</Title>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-8'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{statistics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Paid Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{statistics.paidOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Unpaid Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>{statistics.unpaidOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${statistics.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{statistics.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Area Chart - Orders Over Time */}
      <Card className='mt-8'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Orders Over Time</CardTitle>
              <CardDescription>Track your order trends over different time periods</CardDescription>
            </div>
            <div className='flex gap-2'>
              {(['7d', '30d', '3m', '6m', '12m'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === range
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
          <ChartContainer config={areaChartConfig} className='h-[400px] w-full'>
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
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

      {/* Bar Chart - Orders Per Month (Last 12 Months) */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Orders Per Month</CardTitle>
          <CardDescription>Monthly order distribution for the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className='h-[400px] w-full'>
            <BarChart data={statistics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='orders' fill='var(--color-orders)' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
};

export default StatisticsPage;