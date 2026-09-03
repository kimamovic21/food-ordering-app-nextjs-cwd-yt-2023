'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Star,
  Timer,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAppDate } from '@/libs/dateFormat';
import type {
  CourierEarningsCourier,
  CourierEarningsResponse,
  CourierPerformanceSummary,
  EarningsChartItem,
} from '@/types/courier';

const chartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
};

const initialSummary: CourierPerformanceSummary = {
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
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const CourierEarningsPanel = ({
  endpoint,
  title,
  description,
}: {
  endpoint: string;
  title: string;
  description: string;
}) => {
  const [courier, setCourier] = useState<CourierEarningsCourier | null>(null);
  const [summary, setSummary] = useState<CourierPerformanceSummary>(initialSummary);
  const [earningsChart, setEarningsChart] = useState<EarningsChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoint);
        const json = (await response.json().catch(() => null)) as CourierEarningsResponse | null;

        if (!response.ok) {
          throw new Error((json as any)?.error || 'Failed to load courier earnings');
        }

        if (!cancelled && json) {
          setCourier(json.courier);
          setSummary({
            ...initialSummary,
            ...json.summary,
          });
          setEarningsChart(Array.isArray(json.earningsChart) ? json.earningsChart : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load courier earnings');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEarnings();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-24 w-full rounded-xl' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-[360px] w-full rounded-xl' />
      </div>
    );
  }

  const statCards = [
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
      label: 'Average delivery',
      value: summary.averageDeliveryMinutes ? `${summary.averageDeliveryMinutes} min` : '-',
      icon: Clock,
    },
    {
      label: 'Response rate',
      value: summary.totalAssignments ? `${summary.assignmentResponseRate}%` : '-',
      icon: CheckCircle2,
    },
    {
      label: 'Average response',
      value: summary.averageResponseMinutes ? `${summary.averageResponseMinutes} min` : '-',
      icon: Timer,
    },
    {
      label: 'Late deliveries',
      value: summary.lateDeliveries.toString(),
      icon: AlertTriangle,
    },
    {
      label: 'Missed assignments',
      value: summary.missedAssignments.toString(),
      icon: AlertTriangle,
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
  ];

  return (
    <div className='space-y-6'>
      <Card>
        <CardContent className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className='size-14'>
              <AvatarImage src={courier?.image || ''} alt={courier?.name || 'Courier'} />
              <AvatarFallback>{getInitials(courier?.name || 'Courier')}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className='text-2xl font-bold'>{title}</h1>
              <p className='text-sm text-muted-foreground'>{description}</p>
              {courier && (
                <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                  <span>{courier.name}</span>
                  <span>{courier.email}</span>
                  {courier.createdAt && (
                    <span className='inline-flex items-center gap-1'>
                      <Calendar className='size-3.5' />
                      Joined {formatAppDate(courier.createdAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {courier && (
            <Badge
              variant={courier.availability ? 'default' : 'secondary'}
              className={courier.availability ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {courier.availability ? 'Online' : 'Offline'}
            </Badge>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'>
          {error}
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {statCards.map((card) => {
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

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]'>
        <Card>
          <CardHeader>
            <CardTitle>Earnings by month</CardTitle>
            <CardDescription>Completed delivery fees grouped by completion month.</CardDescription>
          </CardHeader>
          <CardContent>
            {earningsChart.length > 0 ? (
              <ChartContainer config={chartConfig} className='h-[360px] w-full'>
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
              <p className='py-16 text-center text-sm text-muted-foreground'>
                No completed delivery earnings yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality</CardTitle>
            <CardDescription>Rating and reliability snapshot.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='rounded-lg border p-4'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Star className='size-4 text-yellow-500' />
                Average rating
              </div>
              <p className='mt-2 text-3xl font-bold'>
                {summary.ratingCount ? `${summary.averageRating.toFixed(1)} / 5` : 'No ratings'}
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {summary.ratingCount} courier review{summary.ratingCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-sm text-muted-foreground'>Delivery reliability</div>
              <p className='mt-2 text-3xl font-bold'>{summary.lateDeliveries}</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Late deliveries after the grace period.
              </p>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-sm text-muted-foreground'>Assignment reliability</div>
              <p className='mt-2 text-3xl font-bold'>
                {summary.totalAssignments ? `${summary.assignmentResponseRate}%` : 'No data'}
              </p>
              <div className='mt-3 h-2 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-green-600'
                  style={{ width: `${Math.min(100, summary.assignmentResponseRate)}%` }}
                />
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                {summary.respondedAssignments} responded, {summary.missedAssignments} missed.
              </p>
              {summary.respondedAssignments > 0 && (
                <p className='mt-1 text-sm text-muted-foreground'>
                  {summary.assignmentAcceptanceRate}% acceptance rate after responding.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourierEarningsPanel;
