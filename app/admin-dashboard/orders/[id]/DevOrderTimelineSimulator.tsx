'use client';

import { Clock, Plus, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import type {
  OrderPhaseDurationOffsetKey,
  OrderPhaseDurationOffsets,
} from '@/components/shared/OrderPhaseTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DevOrderTimeSimulatorOffsetKey =
  OrderPhaseDurationOffsetKey | 'failedDeliveryWait' | 'readyWithoutCourierWait';

type DevOrderTimelineSimulatorProps = {
  offsets: OrderPhaseDurationOffsets;
  onIncrement: (key: DevOrderTimeSimulatorOffsetKey) => void;
  onReset: () => void;
};

const controls: { key: DevOrderTimeSimulatorOffsetKey; label: string; hint?: string }[] = [
  { key: 'waitingForKitchen', label: 'Waiting for kitchen' },
  { key: 'kitchenPreparation', label: 'Kitchen preparation' },
  { key: 'deliveryTravel', label: 'Delivery travel' },
  { key: 'confirmationWait', label: 'Confirmation wait' },
  {
    key: 'failedDeliveryWait',
    label: 'Customer unavailable wait',
    hint: 'Any value unlocks the courier failed-delivery button in development.',
  },
  {
    key: 'readyWithoutCourierWait',
    label: 'Ready without courier',
    hint: 'Adds time only for auto-cancel testing when an order is ready but has no courier.',
  },
];

const DevOrderTimelineSimulator = ({
  offsets,
  onIncrement,
  onReset,
}: DevOrderTimelineSimulatorProps) => {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!open) {
    return (
      <Button
        type='button'
        onClick={() => setOpen(true)}
        className='fixed bottom-5 right-5 z-50 gap-2 shadow-2xl'
      >
        <Clock className='size-4' />
        Dev time
      </Button>
    );
  }

  const totalOffset = controls.reduce((total, control) => total + (offsets[control.key] ?? 0), 0);

  return (
    <Card className='fixed bottom-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(92vw,380px)] flex-col overflow-hidden border-border/80 bg-background/95 shadow-2xl backdrop-blur sm:bottom-5 sm:right-5 sm:max-h-[calc(100vh-2.5rem)]'>
      <CardHeader className='shrink-0 space-y-3 pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Clock className='size-4 text-primary' />
              Dev time simulator
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              Add simulated minutes without changing MongoDB data. Use it to test delivery timing,
              failed-delivery checks, and ready-without-courier auto-cancel.
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8 cursor-pointer'
            aria-label='Hide dev time simulator'
            onClick={() => setOpen(false)}
          >
            <X className='size-4' />
          </Button>
        </div>
        <div className='flex items-center justify-between gap-3'>
          <Badge className='bg-amber-500 text-white hover:bg-amber-500'>Development only</Badge>
          <span className='text-xs text-muted-foreground'>Total simulated: {totalOffset} min</span>
        </div>
      </CardHeader>
      <CardContent className='min-h-0 space-y-3 overflow-y-auto pr-3'>
        {controls.map((control) => {
          const offset = offsets[control.key] ?? 0;

          return (
            <div
              key={control.key}
              className='flex items-center justify-between gap-3 rounded-lg border bg-muted/25 p-3'
            >
              <div>
                <p className='text-sm font-semibold'>{control.label}</p>
                <p className='text-xs text-muted-foreground'>Simulated: +{offset} min</p>
                {control.hint && (
                  <p className='mt-1 text-xs text-muted-foreground'>{control.hint}</p>
                )}
              </div>
              <Button
                type='button'
                size='sm'
                className='shrink-0 gap-1'
                onClick={() => onIncrement(control.key)}
              >
                <Plus className='size-3.5' />1 min
              </Button>
            </div>
          );
        })}

        <Button type='button' variant='outline' className='w-full gap-2' onClick={onReset}>
          <RotateCcw className='size-4' />
          Reset simulated time
        </Button>
      </CardContent>
    </Card>
  );
};

export default DevOrderTimelineSimulator;
