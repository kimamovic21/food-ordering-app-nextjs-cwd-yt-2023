'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useProfile from '@/contexts/UseProfile';
import Link from 'next/link';
import Title from '@/components/shared/Title';
import StatisticsLoading from './loading';

interface StatisticsSummary {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalIncome: number;
  totalUsers: number;
}

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { loading: profileLoading, data: profileData } = useProfile();

  useEffect(() => {
    if (!profileLoading && profileData?.role !== 'admin') {
      redirect('/');
    }
  }, [profileLoading, profileData]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics');
        if (response.ok) {
          const data = await response.json();
          setStatistics({
            totalOrders: data.totalOrders,
            paidOrders: data.paidOrders,
            unpaidOrders: data.unpaidOrders,
            totalIncome: data.totalIncome,
            totalUsers: data.totalUsers,
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profileData?.role === 'admin') {
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

  return (
    <section className='mt-8 max-w-7xl mx-auto px-4 pb-12'>
      <Title>Statistics</Title>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-8'>
        <Card className='h-full flex flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Orders</CardTitle>
          </CardHeader>
          <CardContent className='mt-auto'>
            <div className='text-2xl font-bold'>{statistics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className='h-full flex flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Paid Orders</CardTitle>
          </CardHeader>
          <CardContent className='mt-auto'>
            <div className='text-2xl font-bold text-green-600'>{statistics.paidOrders}</div>
          </CardContent>
        </Card>

        <Card className='h-full flex flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Unpaid Orders</CardTitle>
          </CardHeader>
          <CardContent className='mt-auto'>
            <div className='text-2xl font-bold text-orange-600'>{statistics.unpaidOrders}</div>
          </CardContent>
        </Card>

        <Card className='h-full flex flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
          </CardHeader>
          <CardContent className='mt-auto'>
            <div className='text-2xl font-bold'>${statistics.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className='h-full flex flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
          </CardHeader>
          <CardContent className='mt-auto'>
            <div className='text-2xl font-bold'>{statistics.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <p className='mt-8 text-sm text-muted-foreground'>See more stats:</p>
      <div className='mt-3 flex gap-3'>
        <Button asChild>
          <Link href='/statistics/orders'>Orders statistics</Link>
        </Button>
        <Button asChild>
          <Link href='/statistics/users'>Users statistics</Link>
        </Button>
      </div>
    </section>
  );
};

export default StatisticsPage;
