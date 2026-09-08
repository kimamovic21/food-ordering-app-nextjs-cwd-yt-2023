'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatAppTime } from '@/libs/dateFormat';
import { formatPaymentExpiryDuration, getPaymentExpiryState } from '@/libs/paymentExpiry';
import { cn } from '@/libs/utils';
import type { OrderStatus } from '@/types/order';

type PaymentExpiryCountdownProps = {
  createdAt?: Date | string | null;
  orderStatus?: OrderStatus | string | null;
  paymentStatus?: boolean | null;
  compact?: boolean;
  className?: string;
};

const PaymentExpiryCountdown = ({
  createdAt,
  orderStatus,
  paymentStatus,
  compact = false,
  className,
}: PaymentExpiryCountdownProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const expiryState = getPaymentExpiryState({
    createdAt,
    orderStatus,
    paymentStatus,
    now,
  });

  if (!expiryState) {
    return null;
  }

  const label = expiryState.isExpired
    ? 'Payment window expired'
    : `Payment expires in ${formatPaymentExpiryDuration(expiryState.remainingSeconds)}`;

  if (compact) {
    return (
      <span
        className={cn(
          'mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
          expiryState.isExpired
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
          className
        )}
      >
        <Clock3 className='size-3' aria-hidden='true' />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
        expiryState.isExpired
          ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
          : 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
        className
      )}
    >
      <div className='flex items-start gap-3'>
        <Clock3 className='mt-0.5 size-5 shrink-0' aria-hidden='true' />
        <div>
          <p className='font-semibold'>Hosted checkout is temporary</p>
          <p className='mt-1 text-sm opacity-90'>
            {expiryState.isExpired
              ? 'Open a fresh Stripe Checkout link to finish this unpaid order.'
              : `Finish payment before ${formatAppTime(expiryState.expiresAt)} or this unpaid order can be canceled automatically.`}
          </p>
        </div>
      </div>
      <Badge
        variant='outline'
        className={cn(
          'shrink-0 bg-background/70 font-mono',
          expiryState.isExpired ? 'text-red-700 dark:text-red-200' : 'text-amber-700'
        )}
      >
        {label}
      </Badge>
    </div>
  );
};

export default PaymentExpiryCountdown;
