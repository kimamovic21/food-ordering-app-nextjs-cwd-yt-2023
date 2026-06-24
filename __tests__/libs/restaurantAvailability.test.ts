import { describe, expect, it } from 'vitest';
import {
  getRestaurantOrderingStatus,
  isRestaurantOpen,
  normalizeDeliveryRadiusKm,
} from '@/libs/restaurantAvailability';

const openWorkingHours = [
  { day: 'wednesday', openTime: '09:00', closeTime: '21:00', isClosed: false },
];

describe('restaurant availability helpers', () => {
  it('detects working hours and blocked dates', () => {
    const date = new Date('2026-06-24T12:00:00');

    expect(isRestaurantOpen(openWorkingHours, [], date)).toBe(true);
    expect(
      isRestaurantOpen(openWorkingHours, [{ date: '2026-06-24', reason: 'Holiday' }], date)
    ).toBe(false);
  });

  it('normalizes delivery radius to recommended app bounds', () => {
    expect(normalizeDeliveryRadiusKm(undefined)).toBe(10);
    expect(normalizeDeliveryRadiusKm(0)).toBe(10);
    expect(normalizeDeliveryRadiusKm(18)).toBe(15);
    expect(normalizeDeliveryRadiusKm(7)).toBe(7);
  });

  it('blocks paused restaurants before radius checks', () => {
    const status = getRestaurantOrderingStatus({
      restaurant: {
        isPaused: true,
        pauseReason: 'Kitchen is full',
        workingHours: openWorkingHours,
        blockedDates: [],
        latitude: 43.8563,
        longitude: 18.4131,
      },
      deliveryLatitude: 43.8563,
      deliveryLongitude: 18.4131,
      now: new Date('2026-06-24T12:00:00'),
    });

    expect(status.isAcceptingOrders).toBe(false);
    expect(status.reason).toBe('Kitchen is full');
  });

  it('returns distance status for delivery radius', () => {
    const status = getRestaurantOrderingStatus({
      restaurant: {
        workingHours: openWorkingHours,
        blockedDates: [],
        latitude: 43.8563,
        longitude: 18.4131,
        deliveryRadiusKm: 1,
      },
      deliveryLatitude: 43.8663,
      deliveryLongitude: 18.4231,
      now: new Date('2026-06-24T12:00:00'),
    });

    expect(status.isWithinDeliveryRadius).toBe(false);
    expect(status.isAcceptingOrders).toBe(false);
    expect(status.reason).toContain('This restaurant delivers within 1 km');
  });
});
