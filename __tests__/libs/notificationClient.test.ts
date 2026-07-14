import { describe, expect, it } from 'vitest';
import { resolveNotificationTargetPath } from '@/libs/notificationClient';

describe('resolveNotificationTargetPath', () => {
  it('routes failed delivery review notifications to the admin order details page', () => {
    expect(
      resolveNotificationTargetPath(
        {
          type: 'order_canceled',
          orderId: '6a564350622d630bb92decbc',
          metadata: {
            restaurantId: '6a2185248697d815fec54978',
            failedDeliveryRequested: true,
          },
        },
        'admin'
      )
    ).toBe('/admin-dashboard/orders/6a564350622d630bb92decbc');
  });

  it('keeps customer canceled-order notifications on the customer order page', () => {
    expect(
      resolveNotificationTargetPath(
        {
          type: 'order_canceled',
          orderId: '6a564350622d630bb92decbc',
          metadata: {
            orderStatus: 'canceled',
            canceledBy: 'customer',
          },
        },
        'user'
      )
    ).toBe('/my-orders/6a564350622d630bb92decbc');
  });
});
