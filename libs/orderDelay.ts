import type { OrderStatus } from '@/types/order';

export const ORDER_DELAY_GRACE_MINUTES = 5;

const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>(['completed', 'canceled']);

export type OrderDelayNotice = {
  delayedByMinutes: number;
  elapsedMinutes: number;
  expectedMinutes: number;
  title: string;
  message: string;
};

type GetOrderDelayNoticeParams = {
  createdAt?: string | Date | null;
  orderStatus?: OrderStatus | string | null;
  estimatedTotalMinutes?: number | null;
  now?: Date;
  durationOffsetMinutes?: number;
};

export const getOrderDelayNotice = ({
  createdAt,
  orderStatus,
  estimatedTotalMinutes,
  now = new Date(),
  durationOffsetMinutes = 0,
}: GetOrderDelayNoticeParams): OrderDelayNotice | null => {
  if (!createdAt || TERMINAL_ORDER_STATUSES.has(orderStatus as OrderStatus)) {
    return null;
  }

  const expectedMinutes = Number(estimatedTotalMinutes);
  const startedAt = new Date(createdAt).getTime();
  const checkedAt = now.getTime();

  if (!Number.isFinite(expectedMinutes) || expectedMinutes <= 0) {
    return null;
  }

  if (!Number.isFinite(startedAt) || !Number.isFinite(checkedAt) || checkedAt < startedAt) {
    return null;
  }

  const offsetMinutes = Math.max(0, Number(durationOffsetMinutes) || 0);
  const elapsedMinutes = Math.floor((checkedAt - startedAt) / 60000 + offsetMinutes);
  const delayedByMinutes = elapsedMinutes - expectedMinutes;

  if (delayedByMinutes <= ORDER_DELAY_GRACE_MINUTES) {
    return null;
  }

  return {
    delayedByMinutes,
    elapsedMinutes,
    expectedMinutes,
    title: 'Your order is taking longer than expected',
    message:
      'The restaurant or courier may need a little more time. Keep this page open for the latest status updates.',
  };
};
