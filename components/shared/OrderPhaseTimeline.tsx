'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMillisecondsToTime } from '@/libs/useOrderElapsedTime';

type OrderPhaseTimelineProps = {
  createdAt: string;
  processingAt?: string | null;
  readyAt?: string | null;
  transportationAt?: string | null;
  courierDeliveredAt?: string | null;
  completedAt?: string | null;
  orderStatus?: string;
  estimatedPreparationMinutes?: number | null;
  estimatedDeliveryMinutes?: number | null;
  estimatedTotalMinutes?: number | null;
};

const formatDuration = (start?: string | null, end?: string | null) => {
  if (!start) return 'Not started';

  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 'Not available';
  }

  return formatMillisecondsToTime(endTime - startTime);
};

const formatEstimate = (minutes?: number | null) => {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return 'Not set';
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const remainingMinutes = value % 60;

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const OrderPhaseTimeline = ({
  createdAt,
  processingAt,
  readyAt,
  transportationAt,
  courierDeliveredAt,
  completedAt,
  orderStatus,
  estimatedPreparationMinutes,
  estimatedDeliveryMinutes,
  estimatedTotalMinutes,
}: OrderPhaseTimelineProps) => {
  const resolvedEstimatedTotalMinutes =
    estimatedTotalMinutes ??
    (Number(estimatedPreparationMinutes || 0) + Number(estimatedDeliveryMinutes || 0) || null);

  const checkpoints = [
    { label: 'Placed', done: Boolean(createdAt) },
    { label: 'Kitchen started', done: Boolean(processingAt) },
    { label: 'Ready', done: Boolean(readyAt) },
    { label: 'Out for delivery', done: Boolean(transportationAt) },
    { label: 'Courier handoff', done: Boolean(courierDeliveredAt) },
    { label: 'Completed', done: Boolean(completedAt) || orderStatus === 'completed' },
  ];

  const phases = [
    {
      label: 'Waiting for kitchen',
      value: formatDuration(createdAt, processingAt),
      description: 'From order placement until the kitchen started preparing it.',
    },
    {
      label: 'Kitchen preparation',
      value: processingAt ? formatDuration(processingAt, readyAt) : 'Not started',
      description: 'From preparation start until the order was ready for pickup.',
    },
    {
      label: 'Delivery travel',
      value: transportationAt
        ? formatDuration(transportationAt, courierDeliveredAt)
        : 'Not started',
      description: 'From courier assignment until courier handoff.',
    },
    {
      label: 'Confirmation wait',
      value: courierDeliveredAt ? formatDuration(courierDeliveredAt, completedAt) : 'Not started',
      description: 'From courier handoff until customer or admin confirmation.',
    },
    {
      label: 'Total order time',
      value: formatDuration(createdAt, completedAt),
      description: 'From order placement until final completion.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle>Order Timeline</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Estimated timing and actual phase durations for this order.
            </p>
          </div>
          {orderStatus && (
            <Badge variant='secondary' className='w-fit capitalize'>
              {orderStatus}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-sm font-semibold'>Estimated prep</p>
            <p className='mt-1 font-mono text-lg font-bold'>
              {formatEstimate(estimatedPreparationMinutes)}
            </p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-sm font-semibold'>Estimated delivery</p>
            <p className='mt-1 font-mono text-lg font-bold'>
              {formatEstimate(estimatedDeliveryMinutes)}
            </p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-sm font-semibold'>Estimated total</p>
            <p className='mt-1 font-mono text-lg font-bold'>
              {formatEstimate(resolvedEstimatedTotalMinutes)}
            </p>
          </div>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checkpoint.done
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-100'
                  : 'bg-muted/20 text-muted-foreground'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  checkpoint.done ? 'bg-green-500' : 'bg-muted-foreground/40'
                }`}
              />
              {checkpoint.label}
            </div>
          ))}
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          {phases.map((phase) => (
            <div key={phase.label} className='rounded-lg border p-3'>
              <p className='text-sm font-semibold'>{phase.label}</p>
              <p className='mt-1 font-mono text-lg font-bold'>{phase.value}</p>
              <p className='mt-1 text-xs text-muted-foreground'>{phase.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderPhaseTimeline;
