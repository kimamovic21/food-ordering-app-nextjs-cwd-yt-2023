'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useProfile from '@/hooks/useProfile';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import StatisticsLoading from './loading';
import type { StatisticsSummary } from '@/types/statistics';

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
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

    if (
      profileData?.role === 'admin' &&
      profileData?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    ) {
      fetchStatistics();
    }
  }, [profileData]);

  if (profileLoading || loading) {
    return <StatisticsLoading />;
  }

  if (!statistics) {
    return (
      <section className='mt-8 max-w-7xl mx-auto px-4'>
        <Title>Statistics</Title>
        <div className='mt-8 text-center'>Failed to load statistics</div>
      </section>
    );
  }

  const metricCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(statistics.totalIncome),
      tone: 'text-green-600',
    },
    {
      label: 'Net Revenue',
      value: formatCurrency(statistics.netRevenue),
      tone: 'text-green-600',
    },
    {
      label: 'Average Order',
      value: formatCurrency(statistics.averageOrderValue),
      tone: '',
    },
    {
      label: 'Payment Rate',
      value: formatPercent(statistics.paymentConversionRate),
      tone: 'text-green-600',
    },
    {
      label: 'Total Orders',
      value: statistics.totalOrders.toString(),
      tone: '',
    },
    {
      label: 'Active Orders',
      value: statistics.activeOrders.toString(),
      tone: 'text-orange-600',
    },
    {
      label: 'Canceled Orders',
      value: statistics.canceledOrders.toString(),
      tone: 'text-red-600',
    },
    {
      label: 'Open Tickets',
      value: statistics.openSupportTickets.toString(),
      tone: 'text-red-600',
    },
  ];

  const platformCards = [
    { label: 'Users', value: statistics.totalUsers },
    { label: 'Customers', value: statistics.totalCustomers },
    { label: 'Admins', value: statistics.totalAdmins },
    { label: 'Couriers', value: statistics.totalCouriers },
    { label: 'Restaurants', value: statistics.totalRestaurants },
    { label: 'Menu Items', value: statistics.totalMenuItems },
    { label: 'Unavailable Items', value: statistics.unavailableMenuItems },
    { label: 'Unread Notifications', value: statistics.unreadNotifications },
  ];

  const maxStatusCount = Math.max(...statistics.statusData.map((item) => item.count), 1);

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Title>Statistics</Title>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-8'>
        {metricCards.map((card) => (
          <Card key={card.label} className='h-full flex flex-col'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>{card.label}</CardTitle>
            </CardHeader>
            <CardContent className='mt-auto'>
              <div className={`text-2xl font-bold ${card.tone}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4'>
        {platformCards.map((card) => (
          <Card key={card.label} className='h-full flex flex-col'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>{card.label}</CardTitle>
            </CardHeader>
            <CardContent className='mt-auto'>
              <div className='text-2xl font-bold'>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-6 lg:grid-cols-2 mt-8'>
        <Card>
          <CardHeader>
            <CardTitle>Order status mix</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {statistics.statusData.map((item) => (
              <div key={item.status} className='space-y-2'>
                <div className='flex items-center justify-between gap-4 text-sm'>
                  <span className='font-medium'>{item.label}</span>
                  <span className='text-muted-foreground'>{item.count}</span>
                </div>
                <div className='h-2 rounded-full bg-muted'>
                  <div
                    className='h-2 rounded-full bg-primary'
                    style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top restaurants</CardTitle>
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

      <p className='mt-8 text-sm text-muted-foreground'>See more stats:</p>
      <div className='mt-3 flex gap-3'>
        <Button asChild>
          <Link href='/admin-dashboard/statistics/orders'>Orders statistics</Link>
        </Button>
        <Button asChild>
          <Link href='/admin-dashboard/statistics/users'>Users statistics</Link>
        </Button>
      </div>
    </section>
  );
};

export default StatisticsPage;
