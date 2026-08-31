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
import UsersStatisticsLoading from './loading';
import { formatAppShortDate } from '@/libs/dateFormat';
import type { StatisticsTimeRange, UsersStatistics } from '@/types/statistics';

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const UsersStatisticsPage = () => {
  const [statistics, setStatistics] = useState<UsersStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<StatisticsTimeRange>('30d');
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
        const response = await fetch('/api/statistics/users');
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        }
      } catch (error) {
        console.error('Error fetching user statistics:', error);
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
    users: {
      label: 'Users',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  const breakdownChartConfig = {
    count: {
      label: 'Users',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  if (profileLoading || loading) {
    return <UsersStatisticsLoading />;
  }

  if (!statistics) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4'>
        <Title>Users statistics</Title>
        <div className='mt-4 text-center'>Failed to load statistics</div>
      </section>
    );
  }

  const metricCards = [
    {
      title: 'Total Users',
      description: 'Registered accounts',
      value: statistics.totalUsers.toString(),
      tone: '',
    },
    {
      title: 'Customers',
      description: 'Regular buyer accounts',
      value: statistics.totalCustomers.toString(),
      tone: '',
    },
    {
      title: 'Restaurant Admins',
      description: 'Restaurant owner accounts',
      value: statistics.totalAdmins.toString(),
      tone: '',
    },
    {
      title: 'Couriers',
      description: 'Delivery worker accounts',
      value: statistics.totalCouriers.toString(),
      tone: '',
    },
    {
      title: 'Google Sign-ins',
      description: 'OAuth account registrations',
      value: statistics.googleUsers.toString(),
      tone: 'text-green-600',
    },
    {
      title: 'Credentials Sign-ins',
      description: 'Email and password accounts',
      value: statistics.credentialsUsers.toString(),
      tone: '',
    },
    {
      title: 'Verified Emails',
      description: `${formatPercent(statistics.verificationRate)} verification rate`,
      value: statistics.verifiedUsers.toString(),
      tone: 'text-green-600',
    },
    {
      title: 'Unverified Emails',
      description: 'Accounts still needing verification',
      value: statistics.unverifiedUsers.toString(),
      tone: 'text-orange-600',
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
            <BreadcrumbPage>Users statistics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Users statistics</Title>

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
            <CardTitle>Users by role</CardTitle>
            <CardDescription>Customer, admin, and courier account split</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={breakdownChartConfig} className='h-[320px] w-full'>
              <BarChart
                data={statistics.roleData}
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
            <CardTitle>Users by sign-in method</CardTitle>
            <CardDescription>Google OAuth compared with credentials accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={breakdownChartConfig} className='h-[320px] w-full'>
              <BarChart
                data={statistics.providerData}
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
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Users Over Time</CardTitle>
              <CardDescription>Track new registrations across different ranges</CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['7d', '30d', '3m', '6m', '12m'] as StatisticsTimeRange[]).map((range) => (
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
                <linearGradient id='fillUsers' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-users)' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='var(--color-users)' stopOpacity={0.1} />
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
                dataKey='users'
                stroke='var(--color-users)'
                fill='url(#fillUsers)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Users Per Month</CardTitle>
          <CardDescription>Last 12 months of registrations</CardDescription>
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
              <Bar dataKey='users' fill='var(--color-users)' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
};

export default UsersStatisticsPage;
