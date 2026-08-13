'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import Title from '@/components/shared/Title';
import type { RestaurantReportPeriod, RestaurantReportSummary } from '@/libs/restaurantReports';
import { formatAppDate } from '@/libs/dateFormat';

type ReportResponse = {
  restaurant: {
    _id: string;
    name: string;
  };
  report: RestaurantReportSummary;
};

const periodOptions: Array<{ value: RestaurantReportPeriod; label: string }> = [
  { value: 'daily', label: 'Daily report' },
  { value: 'weekly', label: 'Weekly report' },
  { value: 'monthly', label: 'Monthly report' },
];

const formatMoney = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;
const formatPercent = (value: number) => `${(Number(value) || 0).toFixed(2)}%`;
const todayInputValue = () => new Date().toISOString().slice(0, 10);

const metricCards = (report: RestaurantReportSummary) => [
  { label: 'Net revenue', value: formatMoney(report.netRevenue) },
  { label: 'Total orders', value: report.totalOrders.toString() },
  { label: 'Average order', value: formatMoney(report.averageOrderValue) },
  { label: 'Paid orders', value: report.paidOrders.toString() },
  { label: 'Completed', value: report.completedOrders.toString() },
  { label: 'Canceled', value: report.canceledOrders.toString() },
  { label: 'Payment rate', value: formatPercent(report.paymentRate) },
  { label: 'Completion rate', value: formatPercent(report.completionRate) },
  { label: 'Cancellation rate', value: formatPercent(report.cancellationRate) },
];

const RestaurantReportsPage = () => {
  const [period, setPeriod] = useState<RestaurantReportPeriod>('daily');
  const [date, setDate] = useState(todayInputValue);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const report = data?.report || null;

  const reportUrl = useMemo(() => {
    const params = new URLSearchParams({ period, date });

    return `/api/restaurant/reports?${params.toString()}`;
  }, [date, period]);

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams({ period, date });

    return `/api/restaurant/reports/pdf?${params.toString()}`;
  }, [date, period]);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(reportUrl, { cache: 'no-store' });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to load restaurant report');
      }

      setData(json);
    } catch (error) {
      sonnerToast.error(
        error instanceof Error ? error.message : 'Failed to load restaurant report'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [reportUrl]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDownload = () => {
    if (!report?.hasActivity) {
      sonnerToast.error('There is no activity to download for this period.');
      return;
    }

    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div>
          <Title>Restaurant Reports</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Daily, weekly, and monthly performance reports for your restaurant.
          </p>
        </div>
        <Button
          type='button'
          onClick={handleDownload}
          disabled={loading || !report?.hasActivity}
          className='gap-2'
        >
          <Download className='size-4' />
          Download PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <FileText className='size-5 text-primary' />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-[1fr_1fr_auto]'>
            <label className='space-y-2 text-sm font-semibold'>
              Report type
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as RestaurantReportPeriod)}
                className='h-11 w-full rounded-md border border-input bg-background px-3 text-sm'
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className='space-y-2 text-sm font-semibold'>
              Date
              <input
                type='date'
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className='h-11 w-full rounded-md border border-input bg-background px-3 text-sm'
              />
            </label>
            <Button
              type='button'
              variant='outline'
              onClick={loadReport}
              disabled={loading}
              className='mt-auto gap-2'
            >
              <RefreshCcw className='size-4' />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-lg' />
          ))}
        </div>
      ) : report ? (
        <>
          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>{data?.restaurant.name}</p>
                <h2 className='text-2xl font-bold'>{report.label}</h2>
                <p className='text-sm text-muted-foreground'>
                  {formatAppDate(report.startDate)} - {formatAppDate(report.endDate)}
                </p>
              </div>
              <div className='flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm'>
                <TrendingUp className='size-4 text-primary' />
                {report.hasActivity
                  ? `${report.totalOrders} orders in this period`
                  : 'No restaurant activity in this period'}
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {metricCards(report).map((metric) => (
              <Card key={metric.label}>
                <CardContent className='p-5'>
                  <p className='text-sm text-muted-foreground'>{metric.label}</p>
                  <p className='mt-2 text-2xl font-bold'>{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='grid gap-4 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Money Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                {[
                  ['Total paid revenue', formatMoney(report.totalRevenue)],
                  ['Canceled value', formatMoney(report.canceledValue)],
                  ['Tax', formatMoney(report.totalTax)],
                  ['Delivery fees', formatMoney(report.deliveryFees)],
                  ['Coupon discounts', formatMoney(report.couponDiscounts)],
                  ['Loyalty discounts', formatMoney(report.loyaltyDiscounts)],
                ].map(([label, value]) => (
                  <div key={label} className='flex items-center justify-between gap-3'>
                    <span className='text-muted-foreground'>{label}</span>
                    <span className='font-semibold'>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Top Items</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                {report.topItems.length > 0 ? (
                  report.topItems.map((item) => (
                    <div
                      key={item.name}
                      className='flex items-center justify-between gap-3 rounded-md border border-border p-3'
                    >
                      <div>
                        <p className='font-semibold'>{item.name}</p>
                        <p className='text-muted-foreground'>{item.quantity} sold</p>
                      </div>
                      <span className='font-semibold'>{formatMoney(item.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <p className='rounded-md border border-dashed border-border p-4 text-muted-foreground'>
                    No items sold in this period. All report values stay at 0.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className='p-8 text-center text-muted-foreground'>
            Report data is not available right now.
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default RestaurantReportsPage;
