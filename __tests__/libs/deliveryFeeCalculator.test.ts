import { describe, it, expect } from 'vitest';
import { calculateDeliveryFee, getFeeDescription } from '@/libs/deliveryFeeCalculator';

describe('deliveryFeeCalculator', () => {
  it('returns default base fee when called without custom base', async () => {
    const breakdown = await calculateDeliveryFee({ latitude: 0, longitude: 0 });
    expect(breakdown.baseFee).toBe(5);
    expect(breakdown.totalFee).toBe(5);
    expect(breakdown.weatherAdjustment).toBe(0);
  });

  it('accepts a custom base delivery fee', async () => {
    const breakdown = await calculateDeliveryFee({ latitude: 0, longitude: 0 }, 7.5);
    expect(breakdown.baseFee).toBe(7.5);
    expect(breakdown.totalFee).toBe(7.5);
  });

  it('formats a fee description string', () => {
    const desc = getFeeDescription({
      baseFee: 5,
      weatherAdjustment: 0,
      totalAdjustment: 0,
      totalFee: 5,
    });
    expect(desc).toContain('Base: $5.00');
    expect(desc).toContain('Total: $5.00');
  });
});
