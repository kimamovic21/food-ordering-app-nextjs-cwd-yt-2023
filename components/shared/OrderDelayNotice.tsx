'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getOrderDelayNotice } from '@/libs/orderDelay';
import type { OrderStatus } from '@/types/order';

type OrderDelayNoticeProps = {
  createdAt?: string | null;
  orderStatus?: OrderStatus | string | null;
  estimatedTotalMinutes?: number | null;
  durationOffsetMinutes?: number;
};

const OrderDelayNotice = ({
  createdAt,
  orderStatus,
  estimatedTotalMinutes,
  durationOffsetMinutes = 0,
}: OrderDelayNoticeProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  const notice = getOrderDelayNotice({
    createdAt,
    orderStatus,
    estimatedTotalMinutes,
    now,
    durationOffsetMinutes,
  });

  if (!notice) {
    return null;
  }

  return (
    <Card className='mb-6 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'>
      <CardContent className='flex gap-3 p-4 sm:p-5'>
        <div className='mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200'>
          <AlertTriangle className='size-5' aria-hidden='true' />
        </div>
        <div>
          <p className='font-semibold text-amber-950 dark:text-amber-100'>{notice.title}</p>
          <p className='mt-1 text-sm text-amber-900 dark:text-amber-200'>{notice.message}</p>
          <p className='mt-2 text-xs font-medium text-amber-800 dark:text-amber-200'>
            Expected about {notice.expectedMinutes} min, currently {notice.elapsedMinutes} min.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDelayNotice;
