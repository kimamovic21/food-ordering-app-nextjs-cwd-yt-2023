'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMillisecondsToTime } from '@/libs/useOrderElapsedTime';
import { cn } from '@/libs/utils';
import { getOrderTimelineTotalOffsetMinutes } from '@/libs/devOrderTimeSimulator';

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
  durationOffsetsMinutes?: OrderPhaseDurationOffsets;
};

export type OrderPhaseDurationOffsetKey =
  'waitingForKitchen' | 'kitchenPreparation' | 'deliveryTravel' | 'confirmationWait';

export type OrderPhaseDurationOffsets = Partial<
  Record<
    | OrderPhaseDurationOffsetKey
    | 'failedDeliveryWait'
    | 'readyWithoutCourierWait'
    | 'totalOrderTime',
    number
  >
>;

const formatDuration = (
  start: string | null | undefined,
  end: string | null | undefined,
  now: number,
  offsetMinutes = 0
) => {
  if (!start) return 'Not started';

  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : now;
  const offsetMilliseconds = Math.max(0, Number(offsetMinutes) || 0) * 60 * 1000;

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 'Not available';
  }

  return formatMillisecondsToTime(endTime - startTime + offsetMilliseconds);
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

const getCurrentCheckpointIndex = (status?: string) => {
  if (status === 'completed') return 5;
  if (status === 'delivered') return 4;
  if (status === 'transportation') return 3;
  if (status === 'ready') return 2;
  if (status === 'processing') return 1;
  return 0;
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
  durationOffsetsMinutes,
}: OrderPhaseTimelineProps) => {
  const shouldTick = orderStatus !== 'completed' && orderStatus !== 'canceled' && !completedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!shouldTick) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [shouldTick]);

  const resolvedEstimatedTotalMinutes =
    estimatedTotalMinutes ??
    (Number(estimatedPreparationMinutes || 0) + Number(estimatedDeliveryMinutes || 0) || null);

  const phaseDurationOffsets = {
    waitingForKitchen: durationOffsetsMinutes?.waitingForKitchen ?? 0,
    kitchenPreparation: durationOffsetsMinutes?.kitchenPreparation ?? 0,
    deliveryTravel: durationOffsetsMinutes?.deliveryTravel ?? 0,
    confirmationWait: durationOffsetsMinutes?.confirmationWait ?? 0,
  };
  const totalDurationOffset = getOrderTimelineTotalOffsetMinutes(durationOffsetsMinutes);

  const checkpoints = [
    { label: 'Placed', done: Boolean(createdAt) },
    { label: 'Kitchen started', done: Boolean(processingAt) },
    { label: 'Ready', done: Boolean(readyAt) },
    { label: 'Out for delivery', done: Boolean(transportationAt) },
    { label: 'Courier handoff', done: Boolean(courierDeliveredAt) },
    { label: 'Completed', done: Boolean(completedAt) || orderStatus === 'completed' },
  ];
  const currentCheckpointIndex = getCurrentCheckpointIndex(orderStatus);

  const phases = [
    {
      label: 'Waiting for kitchen',
      value: formatDuration(createdAt, processingAt, now, phaseDurationOffsets.waitingForKitchen),
      description: 'From order placement until the kitchen started preparing it.',
      isLive: Boolean(createdAt && !processingAt && shouldTick),
    },
    {
      label: 'Kitchen preparation',
      value: processingAt
        ? formatDuration(processingAt, readyAt, now, phaseDurationOffsets.kitchenPreparation)
        : 'Not started',
      description: 'From preparation start until the order was ready for pickup.',
      isLive: Boolean(processingAt && !readyAt && shouldTick),
    },
    {
      label: 'Delivery travel',
      value: transportationAt
        ? formatDuration(
            transportationAt,
            courierDeliveredAt,
            now,
            phaseDurationOffsets.deliveryTravel
          )
        : 'Not started',
      description: 'From courier assignment until courier handoff.',
      isLive: Boolean(transportationAt && !courierDeliveredAt && shouldTick),
    },
    {
      label: 'Confirmation wait',
      value: courierDeliveredAt
        ? formatDuration(
            courierDeliveredAt,
            completedAt,
            now,
            phaseDurationOffsets.confirmationWait
          )
        : 'Not started',
      description: 'From courier handoff until customer or admin confirmation.',
      isLive: Boolean(courierDeliveredAt && !completedAt && shouldTick),
    },
    {
      label: 'Total order time',
      value: formatDuration(createdAt, completedAt, now, totalDurationOffset),
      description: 'From order placement until final completion.',
      isLive: false,
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
          <div className='flex flex-wrap items-center gap-2'>
            {shouldTick && (
              <Badge className='w-fit gap-1 bg-green-600 text-white hover:bg-green-600'>
                <span className='size-1.5 rounded-full bg-white' />
                Live
              </Badge>
            )}
            {orderStatus && (
              <Badge variant='secondary' className='w-fit capitalize'>
                {orderStatus}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-xs font-medium uppercase text-muted-foreground'>Estimated prep</p>
            <p className='mt-2 font-mono text-xl font-bold'>
              {formatEstimate(estimatedPreparationMinutes)}
            </p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-xs font-medium uppercase text-muted-foreground'>
              Estimated delivery
            </p>
            <p className='mt-2 font-mono text-xl font-bold'>
              {formatEstimate(estimatedDeliveryMinutes)}
            </p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-xs font-medium uppercase text-muted-foreground'>Estimated total</p>
            <p className='mt-2 font-mono text-xl font-bold'>
              {formatEstimate(resolvedEstimatedTotalMinutes)}
            </p>
          </div>
        </div>

        <div className='grid gap-2 sm:grid-cols-3 xl:grid-cols-6'>
          {checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.label}
              className={cn(
                'flex min-h-12 items-center gap-2 rounded-lg border bg-muted/15 px-3 py-2 text-sm transition-colors',
                index < currentCheckpointIndex && 'text-foreground',
                index === currentCheckpointIndex &&
                  'border-primary/60 bg-primary/10 text-foreground shadow-sm',
                index > currentCheckpointIndex && 'text-muted-foreground opacity-70'
              )}
            >
              <span
                className={cn(
                  'size-2.5 rounded-full',
                  index <= currentCheckpointIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
              <span className='truncate'>{checkpoint.label}</span>
              {checkpoint.done && index < currentCheckpointIndex && (
                <span className='ml-auto text-xs text-muted-foreground'>Done</span>
              )}
            </div>
          ))}
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          {phases.map((phase) => (
            <div
              key={phase.label}
              className={cn(
                'rounded-lg border bg-muted/10 p-4',
                phase.isLive && 'border-primary/50 bg-primary/5'
              )}
            >
              <div className='flex items-start justify-between gap-3'>
                <p className='text-sm font-semibold'>{phase.label}</p>
                {phase.isLive && (
                  <Badge variant='outline' className='border-primary/40 text-primary'>
                    Active
                  </Badge>
                )}
              </div>
              <p className='mt-2 font-mono text-xl font-bold'>{phase.value}</p>
              <p className='mt-1 text-xs text-muted-foreground'>{phase.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderPhaseTimeline;
