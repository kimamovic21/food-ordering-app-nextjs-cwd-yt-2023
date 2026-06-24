import { describe, it, expect } from 'vitest';
import {
  normalizeCouponCode,
  isValidCouponCode,
  calculateCouponDiscountAmount,
  getCouponDateValidationError,
  getCouponValidationError,
  getCouponDateBounds,
  COUPON_PERCENTAGE_MAX,
} from '@/libs/coupon';

describe('coupon utils', () => {
  it('normalizes coupon codes', () => {
    expect(normalizeCouponCode(' ab-c1 ')).toBe('ABC1');
  });

  it('validates coupon codes correctly', () => {
    expect(isValidCouponCode('abc1')).toBe(true);
    expect(isValidCouponCode('a!')).toBe(false);
  });

  it('calculates discount amount and respects caps', () => {
    const coupon = { discountValue: 10 } as any;
    expect(calculateCouponDiscountAmount(100, coupon)).toBe(10);

    const capped = { discountValue: 50, maxDiscountAmount: 12 } as any;
    expect(calculateCouponDiscountAmount(100, capped)).toBe(12);

    const big = { discountValue: 200 } as any;
    // capped by COUPON_PERCENTAGE_MAX
    const maxDiscount = calculateCouponDiscountAmount(100, big);
    expect(maxDiscount).toBe((100 * COUPON_PERCENTAGE_MAX) / 100);
  });

  it('validates coupon date bounds and returns errors on bad input', () => {
    const err1 = getCouponDateValidationError({ startsAt: null, expiresAt: null, now: new Date() });
    expect(err1).toBe('Start date is required.');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const err2 = getCouponDateValidationError({
      startsAt: yesterday.toISOString(),
      expiresAt: tomorrow.toISOString(),
      now,
    });
    expect(err2).toBe('Start date cannot be in the past.');

    const err3 = getCouponDateValidationError({
      startsAt: now.toISOString(),
      expiresAt: yesterday.toISOString(),
      now,
    });
    expect(err3).toBe('Expiry date must be after the start date.');

    const { maxExpiresAt } = getCouponDateBounds(now);
    const tooFar = new Date(maxExpiresAt.getTime() + 24 * 60 * 60 * 1000);
    const err4 = getCouponDateValidationError({
      startsAt: now.toISOString(),
      expiresAt: tooFar.toISOString(),
      now,
    });
    expect(err4).toBe('Expiry date cannot be more than one month from today.');
  });

  it('validates coupon business rules', () => {
    const base: any = {
      isActive: false,
      discountValue: 10,
      usageLimit: null,
      usageCount: 0,
    };
    expect(getCouponValidationError({ coupon: base, subtotal: 100 })).toBe(
      'This coupon is currently unavailable.'
    );

    const inactive: any = { ...base, isActive: true, minimumOrderAmount: 50 };
    expect(getCouponValidationError({ coupon: inactive, subtotal: 10 })).toContain(
      'Minimum order amount'
    );

    const usage: any = { ...base, isActive: true, usageLimit: 1, usageCount: 1 };
    expect(getCouponValidationError({ coupon: usage, subtotal: 100 })).toBe(
      'Coupon usage limit reached.'
    );

    const firstOrderOnly: any = { ...base, isActive: true, firstOrderOnly: true };
    expect(
      getCouponValidationError({
        coupon: firstOrderOnly,
        subtotal: 100,
        completedOrderCount: 1,
      })
    ).toBe('This coupon is for first orders only.');

    const usedByCustomer: any = { ...base, isActive: true, usagePerCustomer: 1 };
    expect(
      getCouponValidationError({
        coupon: usedByCustomer,
        subtotal: 100,
        customerCouponUsageCount: 1,
      })
    ).toBe('You have already used this coupon.');

    const badDiscount: any = { ...base, isActive: true, discountValue: 1 };
    expect(getCouponValidationError({ coupon: badDiscount, subtotal: 100 })).toBe(
      'This coupon is currently unavailable.'
    );
  });
});
