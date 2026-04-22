export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  condition: 'clear' | 'rain' | 'snow' | 'storm';
  temperature: number;
  windSpeed: number;
}

export interface FeeBreakdown {
  baseFee: number;
  weatherAdjustment: number;
  totalAdjustment: number;
  totalFee: number;
  weather?: WeatherData;
}

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
  const parts = [`Base: $${breakdown.baseFee.toFixed(2)}`];

  parts.push(`Total: $${breakdown.totalFee.toFixed(2)}`);

  return parts.join(' | ');
}
