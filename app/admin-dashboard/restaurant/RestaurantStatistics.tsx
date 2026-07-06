'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ShoppingCart, CheckCircle2, XCircle, TrendingUp, Utensils } from 'lucide-react';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';

type MenuPerformanceItem = {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  canceledQuantity: number;
  canceledOrderCount: number;
};

interface Statistics {
  totalUniqueUsers: number;
  totalOrders: number;
  completedOrders: number;
  unsuccessfulOrders: number;
  totalIncome: number;
  menuPerformance: {
    totalMenuItems: number;
    totalMenuRevenue: number;
    topSellingItems: MenuPerformanceItem[];
    leastOrderedItems: MenuPerformanceItem[];
    mostCanceledItems: MenuPerformanceItem[];
  };
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
        sonnerToast.error('Failed to load statistics');
        // Set default values
        setStatistics({
          totalUniqueUsers: 0,
          totalOrders: 0,
          completedOrders: 0,
          unsuccessfulOrders: 0,
          totalIncome: 0,
          menuPerformance: {
            totalMenuItems: 0,
            totalMenuRevenue: 0,
            topSellingItems: [],
            leastOrderedItems: [],
            mostCanceledItems: [],
          },
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
  const menuList = (
    title: string,
    description: string,
    items: MenuPerformanceItem[],
    renderValue: (item: MenuPerformanceItem) => string
  ) => (
    <div className='rounded-lg border p-3'>
      <p className='font-medium'>{title}</p>
      <p className='mb-3 text-xs text-muted-foreground'>{description}</p>
      {items.length > 0 ? (
        <div className='space-y-3'>
          {items.map((item) => (
            <div
              key={`${title}-${item.menuItemId}`}
              className='flex items-start justify-between gap-3'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {item.orderCount} order{item.orderCount === 1 ? '' : 's'}
                </p>
              </div>
              <p className='shrink-0 text-sm font-semibold'>{renderValue(item)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>No data yet.</p>
      )}
    </div>
  );

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {statItem(
            <Users className='h-5 w-5 text-primary' />,
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
            <TrendingUp className='h-5 w-5 text-primary' />,
            'Total Income',
            `$${statistics.totalIncome.toFixed(2)}`
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Utensils className='h-5 w-5' />
            Menu Performance
          </CardTitle>
          <CardDescription>Sales and cancellation signals from your menu items.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-lg border p-3'>
              <p className='text-sm text-muted-foreground'>Tracked menu items</p>
              <p className='text-lg font-semibold'>{statistics.menuPerformance.totalMenuItems}</p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-sm text-muted-foreground'>Menu revenue</p>
              <p className='text-lg font-semibold'>
                ${statistics.menuPerformance.totalMenuRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          {menuList(
            'Top selling items',
            'Paid, non-canceled order quantities.',
            statistics.menuPerformance.topSellingItems,
            (item) => `${item.quantitySold} sold`
          )}

          {menuList(
            'Least ordered items',
            'Items that may need better photos, pricing, or placement.',
            statistics.menuPerformance.leastOrderedItems,
            (item) => `${item.quantitySold} sold`
          )}

          {menuList(
            'Most canceled items',
            'Items appearing most often in canceled orders.',
            statistics.menuPerformance.mostCanceledItems,
            (item) => `${item.canceledQuantity} canceled`
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantStatistics;
