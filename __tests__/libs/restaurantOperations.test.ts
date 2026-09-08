import { buildRestaurantOperationsOverview } from '@/libs/restaurantOperations';

describe('restaurant operations helpers', () => {
  it('summarizes active stages, today revenue, capacity, couriers, and attention orders', () => {
    const now = new Date('2026-09-08T12:00:00.000Z');
    const readyAt = new Date(now.getTime() - 20 * 60000);
    const createdAt = new Date(now.getTime() - 130 * 60000);

    const overview = buildRestaurantOperationsOverview({
      restaurant: {
        _id: 'restaurant-1',
        name: 'Pizza Hub',
        activeOrderLimit: 3,
        isPaused: false,
      },
      todayLabel: '08/09/2026',
      now,
      availableCouriers: 1,
      totalCouriers: 3,
      orderingStatus: {
        isOpen: true,
        isPaused: false,
        isAcceptingOrders: true,
        isClosingSoonForCheckout: false,
        reason: null,
      },
      todayOrders: [
        {
          _id: 'order-1',
          orderStatus: 'completed',
          orderPaid: true,
          total: 20,
        },
        {
          _id: 'order-2',
          orderStatus: 'canceled',
          orderPaid: false,
          total: 15,
        },
      ],
      activeOrders: [
        {
          _id: 'order-3',
          email: 'customer@example.com',
          orderStatus: 'ready',
          orderPaid: true,
          total: 18,
          readyAt,
          createdAt,
          courierId: null,
        },
        {
          _id: 'order-4',
          email: 'second@example.com',
          orderStatus: 'processing',
          orderPaid: true,
          total: 22,
          createdAt: now,
        },
      ],
    });

    expect(overview.restaurant.activeKitchenOrders).toBe(2);
    expect(overview.restaurant.activeOrderLimit).toBe(3);
    expect(overview.restaurant.isNearCapacity).toBe(true);
    expect(overview.restaurant.status.statusLabel).toBe('Busy');
    expect(overview.today.revenue).toBe(20);
    expect(overview.today.canceledOrders).toBe(1);
    expect(overview.couriers).toEqual({
      availableCouriers: 1,
      totalCouriers: 3,
      unavailableCouriers: 2,
    });
    expect(overview.stageCounts).toContainEqual({
      status: 'ready',
      label: 'Ready',
      count: 1,
    });
    expect(overview.attentionOrders[0]).toEqual(
      expect.objectContaining({
        _id: 'order-3',
        reason: 'Ready without courier',
        tone: 'danger',
      })
    );
  });
});
