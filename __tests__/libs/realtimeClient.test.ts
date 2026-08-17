import { describe, expect, it } from 'vitest';
import {
  getNotificationRealtimePayload,
  isOrderRelatedRealtimePayload,
} from '@/libs/realtimeClient';

describe('realtime client helpers', () => {
  it('extracts payload details from custom notification realtime events', () => {
    const event = new CustomEvent('app:notification-realtime', {
      detail: {
        type: 'notification-created',
        orderId: '6a564350622d630bb92decbc',
      },
    });

    expect(getNotificationRealtimePayload(event)).toEqual({
      type: 'notification-created',
      orderId: '6a564350622d630bb92decbc',
    });
  });

  it('matches order-related realtime payloads to a specific order screen', () => {
    expect(
      isOrderRelatedRealtimePayload(
        {
          orderId: '6a564350622d630bb92decbc',
        },
        '6a564350622d630bb92decbc'
      )
    ).toBe(true);

    expect(
      isOrderRelatedRealtimePayload(
        {
          orderId: '6a564350622d630bb92decbc',
        },
        '6a75f16c53ef15e8859f67b0'
      )
    ).toBe(false);
  });

  it('treats any payload with an order id as order-related for list screens', () => {
    expect(
      isOrderRelatedRealtimePayload({
        orderId: '6a564350622d630bb92decbc',
      })
    ).toBe(true);

    expect(
      isOrderRelatedRealtimePayload({
        type: 'notifications-read',
      })
    ).toBe(false);
  });
});
