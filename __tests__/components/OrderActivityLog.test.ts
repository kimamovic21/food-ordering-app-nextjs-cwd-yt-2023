import { buildOrderActivityEvents } from '@/components/shared/OrderActivityLog';

describe('buildOrderActivityEvents', () => {
  it('builds a completed customer-facing order activity history', () => {
    const events = buildOrderActivityEvents({
      orderStatus: 'completed',
      paymentStatus: true,
      createdAt: '2026-09-09T10:00:00.000Z',
      receiptEmailSentAt: '2026-09-09T10:01:00.000Z',
      processingAt: '2026-09-09T10:03:00.000Z',
      readyAt: '2026-09-09T10:20:00.000Z',
      courierAssignedAt: '2026-09-09T10:22:00.000Z',
      courierAcceptedAt: '2026-09-09T10:23:00.000Z',
      restaurantHandedToCourierAt: '2026-09-09T10:25:00.000Z',
      transportationAt: '2026-09-09T10:26:00.000Z',
      courierDeliveredAt: '2026-09-09T10:45:00.000Z',
      customerConfirmedDeliveryAt: '2026-09-09T10:47:00.000Z',
      deliveryCompletedBy: 'customer',
      completedAt: '2026-09-09T10:47:00.000Z',
    });

    expect(events.map((event) => event.id)).toEqual([
      'placed',
      'payment',
      'kitchen-started',
      'ready',
      'courier-assigned',
      'courier-accepted',
      'restaurant-handoff',
      'in-transport',
      'delivered',
      'completed',
    ]);
    expect(events.every((event) => event.status === 'done')).toBe(true);
    expect(events.find((event) => event.id === 'completed')?.description).toBe(
      'Customer confirmed the order was received.'
    );
  });

  it('adds failed delivery and cancellation events', () => {
    const events = buildOrderActivityEvents(
      {
        orderStatus: 'canceled',
        paymentStatus: false,
        createdAt: '2026-09-09T10:00:00.000Z',
        processingAt: '2026-09-09T10:03:00.000Z',
        readyAt: '2026-09-09T10:20:00.000Z',
        courierAssignedAt: '2026-09-09T10:22:00.000Z',
        courierAcceptedAt: '2026-09-09T10:23:00.000Z',
        restaurantHandedToCourierAt: '2026-09-09T10:25:00.000Z',
        transportationAt: '2026-09-09T10:26:00.000Z',
        failedDeliveryRequestedAt: '2026-09-09T11:00:00.000Z',
        failedDeliveryReason: 'Customer did not answer the phone.',
        failedDeliveryVerifiedAt: '2026-09-09T11:05:00.000Z',
        failedDeliveryVerifiedByRole: 'restaurant_owner',
        canceledAt: '2026-09-09T11:05:00.000Z',
        canceledBy: 'restaurant_owner',
        cancellationReason: 'Customer unavailable after courier wait.',
      },
      'admin'
    );

    expect(events.find((event) => event.id === 'payment')).toEqual(
      expect.objectContaining({
        title: 'Payment not completed',
        status: 'danger',
      })
    );
    expect(events.find((event) => event.id === 'failed-delivery-requested')).toEqual(
      expect.objectContaining({
        status: 'warning',
        description:
          'Courier reported customer unavailable. Note: Customer did not answer the phone.',
      })
    );
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        id: 'canceled',
        status: 'danger',
      })
    );
  });
});
