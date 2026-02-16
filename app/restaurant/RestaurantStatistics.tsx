'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ShoppingCart, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Statistics {
  totalUniqueUsers: number;
  totalOrders: number;
  completedOrders: number;
  unsuccessfulOrders: number;
  totalIncome: number;
}

const RestaurantStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/restaurant/statistics');

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error('Failed to load statistics');
        // Set default values
        setStatistics({
          totalUniqueUsers: 0,
          totalOrders: 0,
          completedOrders: 0,
          unsuccessfulOrders: 0,
          totalIncome: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-10 w-10 rounded' />
              <div className='flex-1'>
                <Skeleton className='h-4 w-24 mb-2' />
                <Skeleton className='h-6 w-16' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>Unable to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const statItem = (icon: React.ReactNode, label: string, value: string | number) => (
    <div className='flex items-center gap-4 py-3'>
      <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>{icon}</div>
      <div className='flex-1'>
        <p className='text-sm text-muted-foreground'>{label}</p>
        <p className='text-lg font-semibold'>{value}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {statItem(
          <Users className='h-5 w-5 text-blue-600' />,
          'Total Customers',
          statistics.totalUniqueUsers
        )}

        {statItem(
          <ShoppingCart className='h-5 w-5 text-orange-600' />,
          'Total Orders',
          statistics.totalOrders
        )}

        {statItem(
          <CheckCircle2 className='h-5 w-5 text-green-600' />,
          'Successful Orders',
          statistics.completedOrders
        )}

        {statItem(
          <XCircle className='h-5 w-5 text-red-600' />,
          'Unsuccessful Orders',
          statistics.unsuccessfulOrders
        )}

        <div className='my-4 border-t' />

        {statItem(
          <TrendingUp className='h-5 w-5 text-purple-600' />,
          'Total Income',
          `$${statistics.totalIncome.toFixed(2)}`
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantStatistics;
