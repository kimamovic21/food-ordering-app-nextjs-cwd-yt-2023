'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMillisecondsToTime } from '@/libs/useOrderElapsedTime';

type OrderPhaseTimelineProps = {
  createdAt: string;
  processingAt?: string | null;
  readyAt?: string | null;
  transportationAt?: string | null;
  courierDeliveredAt?: string | null;
  completedAt?: string | null;
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

const OrderPhaseTimeline = ({
  createdAt,
  processingAt,
  readyAt,
  transportationAt,
  courierDeliveredAt,
  completedAt,
}: OrderPhaseTimelineProps) => {
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
        <CardTitle>Order Time Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
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
