import { describe, it, expect } from 'vitest';
import {
  calculateLoyaltyStatus,
  calculateLoyaltyDiscount,
  getTierBadgeColor,
  LOYALTY_TIERS,
} from '@/libs/loyaltyCalculator';

describe('loyaltyCalculator', () => {
  it('returns expected status for 0 orders', () => {
    const status = calculateLoyaltyStatus(0);
    expect(status.currentTier).toBeNull();
    expect(status.nextTier?.name).toBe(LOYALTY_TIERS[0].name);
    expect(status.ordersToNextTier).toBe(LOYALTY_TIERS[0].ordersRequired - 0);
  });

  it('identifies highest tier when orders exceed highest requirement', () => {
    const highest = LOYALTY_TIERS[LOYALTY_TIERS.length - 1];
    const status = calculateLoyaltyStatus(highest.ordersRequired + 10);
    expect(status.currentTier?.name).toBe(highest.name);
    expect(status.nextTier).toBeNull();
  });

  it('calculates loyalty discount and rounds to cents', () => {
    const discount = calculateLoyaltyDiscount(123.456, 10);
    expect(discount).toBe(12.35);
  });

  it('returns badge color for known and unknown tiers', () => {
    expect(getTierBadgeColor('Gold')).toBeDefined();
    expect(getTierBadgeColor('Nope')).toBe('text-gray-500');
  });
});
