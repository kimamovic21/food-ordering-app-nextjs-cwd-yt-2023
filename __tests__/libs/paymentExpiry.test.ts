import { addMinutes } from 'date-fns';
import { formatPaymentExpiryDuration, getPaymentExpiryState } from '@/libs/paymentExpiry';
import { UNPAID_ORDER_AUTO_CANCEL_MINUTES } from '@/libs/orderMaintenanceConfig';

describe('payment expiry helpers', () => {
  it('returns countdown state for unpaid placed orders', () => {
    const createdAt = new Date('2026-09-08T10:00:00.000Z');
    const now = new Date('2026-09-08T10:10:30.000Z');

    const state = getPaymentExpiryState({
      createdAt,
      orderStatus: 'placed',
      paymentStatus: false,
      now,
    });

    expect(state).toEqual({
      expiresAt: addMinutes(createdAt, UNPAID_ORDER_AUTO_CANCEL_MINUTES),
      isExpired: false,
      remainingSeconds: 1170,
    });
  });

  it('returns expired state after the unpaid payment window passes', () => {
    const state = getPaymentExpiryState({
      createdAt: '2026-09-08T10:00:00.000Z',
      orderStatus: 'placed',
      paymentStatus: false,
      now: new Date('2026-09-08T10:31:00.000Z'),
    });

    expect(state?.isExpired).toBe(true);
    expect(state?.remainingSeconds).toBe(0);
  });

  it('does not show a timer for paid or non-placed orders', () => {
    expect(
      getPaymentExpiryState({
        createdAt: '2026-09-08T10:00:00.000Z',
        orderStatus: 'placed',
        paymentStatus: true,
      })
    ).toBeNull();
    expect(
      getPaymentExpiryState({
        createdAt: '2026-09-08T10:00:00.000Z',
        orderStatus: 'processing',
        paymentStatus: false,
      })
    ).toBeNull();
  });

  it('formats remaining payment duration as mm:ss', () => {
    expect(formatPaymentExpiryDuration(125)).toBe('02:05');
    expect(formatPaymentExpiryDuration(-5)).toBe('00:00');
  });
});
