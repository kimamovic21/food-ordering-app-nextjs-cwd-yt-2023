import { formatMoney } from '@/libs/money';
import type { FeeBreakdown, LocationData } from '@/types/delivery';

export type { FeeBreakdown, LocationData, WeatherData } from '@/types/delivery';

/**
 * Calculate delivery fee using a fixed courier fee.
 */
export async function calculateDeliveryFee(
  deliveryLocation: LocationData,
  baseDeliveryFee: number = 5
): Promise<FeeBreakdown> {
  void deliveryLocation;

  return {
    baseFee: baseDeliveryFee,
    weatherAdjustment: 0,
    totalAdjustment: 0,
    totalFee: baseDeliveryFee,
  };
}

/**
 * Get human-readable description of fee breakdown
 */
export function getFeeDescription(breakdown: FeeBreakdown): string {
  const parts = [`Base: ${formatMoney(breakdown.baseFee)}`];

  parts.push(`Total: ${formatMoney(breakdown.totalFee)}`);

  return parts.join(' | ');
}
