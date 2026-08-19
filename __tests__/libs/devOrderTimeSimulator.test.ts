import { describe, expect, it } from 'vitest';
import {
  getOrderTimelineTotalOffsetMinutes,
  sanitizeDevOrderTimeOffsets,
} from '@/libs/devOrderTimeSimulator';

describe('dev order time simulator', () => {
  it('sums phase offsets when total order offset is not explicitly set', () => {
    expect(
      getOrderTimelineTotalOffsetMinutes({
        waitingForKitchen: 2,
        kitchenPreparation: 21,
        deliveryTravel: 10,
        confirmationWait: 1,
        totalOrderTime: 0,
      })
    ).toBe(34);
  });

  it('uses explicit total order offset when it is positive', () => {
    expect(
      getOrderTimelineTotalOffsetMinutes({
        waitingForKitchen: 2,
        kitchenPreparation: 21,
        deliveryTravel: 10,
        confirmationWait: 1,
        totalOrderTime: 50,
      })
    ).toBe(50);
  });

  it('sanitizes unsafe offset values before calculating the total', () => {
    const offsets = sanitizeDevOrderTimeOffsets({
      waitingForKitchen: 2.8,
      kitchenPreparation: '-10',
      deliveryTravel: '3',
      confirmationWait: Number.NaN,
    });

    expect(getOrderTimelineTotalOffsetMinutes(offsets)).toBe(5);
  });
});
