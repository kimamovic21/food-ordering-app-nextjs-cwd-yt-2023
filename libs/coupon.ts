import { multiplyMoney, roundMoney } from '@/libs/money';
import type { CouponLike } from '@/types/coupon';

export type { CouponDiscountType, CouponLike } from '@/types/coupon';

export const COUPON_CODE_PATTERN = /^[A-Z0-9]+$/;
export const COUPON_PERCENTAGE_MIN = 5;
export const COUPON_PERCENTAGE_MAX = 90;

const startOfLocalDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfLocalDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

export const getCouponDateBounds = (now = new Date()) => {
  const minStartsAt = startOfLocalDay(now);
  const maxExpiresAt = new Date(minStartsAt);
  maxExpiresAt.setMonth(maxExpiresAt.getMonth() + 1);

  return {
    minStartsAt,
    maxExpiresAt: endOfLocalDay(maxExpiresAt),
  };
};

export const normalizeCouponCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();

export const isValidCouponCode = (value: string) => {
  const normalized = normalizeCouponCode(value);
  return normalized.length >= 4 && normalized.length <= 20 && COUPON_CODE_PATTERN.test(normalized);
};

export const calculateCouponDiscountAmount = (subtotal: number, coupon: CouponLike) => {
  const baseSubtotal = Math.max(0, Number(subtotal) || 0);
  const percentage = Math.min(
    COUPON_PERCENTAGE_MAX,
    Math.max(COUPON_PERCENTAGE_MIN, Number(coupon.discountValue) || 0)
  );
  const rawDiscount = multiplyMoney(baseSubtotal, percentage / 100);
  const maxDiscountAmount =
    typeof coupon.maxDiscountAmount === 'number' && coupon.maxDiscountAmount > 0
      ? coupon.maxDiscountAmount
      : null;
  const cappedDiscount =
    maxDiscountAmount === null ? rawDiscount : Math.min(rawDiscount, maxDiscountAmount);

  return roundMoney(Math.min(baseSubtotal, cappedDiscount));
};

export const getCouponDateValidationError = ({
  startsAt,
  expiresAt,
  now = new Date(),
}: {
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  now?: Date;
}) => {
  const parsedStartsAt = startsAt ? new Date(startsAt) : null;
  if (!parsedStartsAt || Number.isNaN(parsedStartsAt.getTime())) {
    return 'Start date is required.';
  }

  const { minStartsAt, maxExpiresAt } = getCouponDateBounds(now);
  if (parsedStartsAt.getTime() < minStartsAt.getTime()) {
    return 'Start date cannot be in the past.';
  }

  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
  if (!parsedExpiresAt || Number.isNaN(parsedExpiresAt.getTime())) {
    return 'Expiry date is required.';
  }

  if (parsedExpiresAt.getTime() < parsedStartsAt.getTime()) {
    return 'Expiry date must be after the start date.';
  }

  if (parsedExpiresAt.getTime() > maxExpiresAt.getTime()) {
    return 'Expiry date cannot be more than one month from today.';
  }

  return null;
};

export const getCouponValidationError = ({
  coupon,
  subtotal,
  completedOrderCount = 0,
  customerCouponUsageCount = 0,
  now = new Date(),
}: {
  coupon: CouponLike;
  subtotal: number;
  completedOrderCount?: number;
  customerCouponUsageCount?: number;
  now?: Date;
}) => {
  if (coupon.isActive === false) {
    return 'This coupon is currently unavailable.';
  }

  const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null;
  if (startsAt && !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > now.getTime()) {
    return 'This coupon is not active yet.';
  }

  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) {
    return 'This coupon has expired.';
  }

  const usageLimit = typeof coupon.usageLimit === 'number' ? coupon.usageLimit : null;
  const usageCount = Number(coupon.usageCount || 0);
  if (usageLimit !== null && usageCount >= usageLimit) {
    return 'Coupon usage limit reached.';
  }

  if (coupon.firstOrderOnly && completedOrderCount > 0) {
    return 'This coupon is for first orders only.';
  }

  const usagePerCustomer =
    typeof coupon.usagePerCustomer === 'number' ? Math.max(1, coupon.usagePerCustomer) : null;
  if (usagePerCustomer !== null && customerCouponUsageCount >= usagePerCustomer) {
    return 'You have already used this coupon.';
  }

  const minimumOrderAmount = Math.max(0, Number(coupon.minimumOrderAmount) || 0);
  if (minimumOrderAmount > 0 && (Number(subtotal) || 0) < minimumOrderAmount) {
    return `Minimum order amount for this coupon is $${minimumOrderAmount.toFixed(2)}.`;
  }

  if (
    Number(coupon.discountValue) < COUPON_PERCENTAGE_MIN ||
    Number(coupon.discountValue) > COUPON_PERCENTAGE_MAX
  ) {
    return 'This coupon is currently unavailable.';
  }

  return null;
};
