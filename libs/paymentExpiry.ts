import { addMinutes, differenceInSeconds, isValid } from 'date-fns';
import { UNPAID_ORDER_AUTO_CANCEL_MINUTES } from '@/libs/orderMaintenanceConfig';
import type { OrderStatus } from '@/types/order';

type PaymentExpiryInput = {
  createdAt?: Date | string | null;
  orderStatus?: OrderStatus | string | null;
  paymentStatus?: boolean | null;
  now?: Date;
};

export type PaymentExpiryState = {
  expiresAt: Date;
  isExpired: boolean;
  remainingSeconds: number;
};

export const getPaymentExpiryState = ({
  createdAt,
  orderStatus,
  paymentStatus,
  now = new Date(),
}: PaymentExpiryInput): PaymentExpiryState | null => {
  if (paymentStatus || orderStatus !== 'placed' || !createdAt) {
    return null;
  }

  const createdAtDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (!isValid(createdAtDate)) {
    return null;
  }

  const expiresAt = addMinutes(createdAtDate, UNPAID_ORDER_AUTO_CANCEL_MINUTES);
  const remainingSeconds = Math.max(0, differenceInSeconds(expiresAt, now));

  return {
    expiresAt,
    isExpired: remainingSeconds <= 0,
    remainingSeconds,
  };
};

export const formatPaymentExpiryDuration = (remainingSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(remainingSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
