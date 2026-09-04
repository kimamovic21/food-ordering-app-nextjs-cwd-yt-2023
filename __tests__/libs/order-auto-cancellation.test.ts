import { createAuditLog } from '@/libs/auditLog';
import { notifyOrderAutoCanceled } from '@/libs/notifications';
import {
  applyOrderAutoCancellation,
  READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES,
  UNPAID_ORDER_AUTO_CANCEL_MINUTES,
} from '@/libs/orderAutoCancellation';
import { notifyWaitingUsersIfRestaurantCanAcceptOrders } from '@/libs/restaurantAvailabilityRequests';
import { expireOpenStripeCheckoutSession } from '@/libs/stripeCheckoutSession';

vi.mock('@/libs/auditLog', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('@/libs/notifications', () => ({
  notifyOrderAutoCanceled: vi.fn(),
}));

vi.mock('@/libs/restaurantAvailabilityRequests', () => ({
  notifyWaitingUsersIfRestaurantCanAcceptOrders: vi.fn(),
}));

vi.mock('@/libs/stripeCheckoutSession', () => ({
  expireOpenStripeCheckoutSession: vi.fn(),
}));

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

const createOrderDocument = (overrides: Record<string, unknown> = {}): any => ({
  _id: { toString: () => 'order-1' },
  userId: { toString: () => 'user-1' },
  restaurantId: { toString: () => 'restaurant-1' },
  orderPaid: false,
  paid: false,
  paymentStatus: false,
  orderStatus: 'placed',
  courierId: null,
  courierAssignmentStatus: null,
  stripeSessionId: 'cs_test_order_auto_1',
  cancellationReason: '',
  createdAt: minutesAgo(UNPAID_ORDER_AUTO_CANCEL_MINUTES + 1),
  save: vi.fn(async function save(this: any) {
    return this;
  }),
  ...overrides,
});

describe('order auto cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(expireOpenStripeCheckoutSession).mockResolvedValue({
      attempted: true,
      expired: true,
      skipped: false,
      reason: 'expired',
      sessionId: 'cs_test_order_auto_1',
    });
  });

  it('cancels unpaid placed orders after the payment window expires', async () => {
    const order = createOrderDocument();

    const result = await applyOrderAutoCancellation(order as never);

    expect(result.canceled).toBe(true);
    expect(order.orderStatus).toBe('canceled');
    expect(order.orderPaid).toBe(false);
    expect(order.paid).toBe(false);
    expect(order.canceledBy).toBe('system');
    expect(order.cancellationReason).toContain('payment was not completed');
    expect(expireOpenStripeCheckoutSession).toHaveBeenCalledWith('cs_test_order_auto_1');
    expect(order.save).toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.auto_canceled',
        metadata: expect.objectContaining({
          reason: order.cancellationReason,
          stripeCheckoutSessionExpired: true,
          stripeCheckoutSessionExpirationReason: 'expired',
          stripeCheckoutSessionId: 'cs_test_order_auto_1',
        }),
      })
    );
    expect(notifyOrderAutoCanceled).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: order.userId,
        restaurantId: order.restaurantId,
        orderId: order._id,
      })
    );
    expect(notifyWaitingUsersIfRestaurantCanAcceptOrders).toHaveBeenCalledWith(order.restaurantId);
  });

  it('cancels ready orders when no courier is assigned within the pickup window', async () => {
    const order = createOrderDocument({
      orderPaid: true,
      paid: true,
      paymentStatus: true,
      orderStatus: 'ready',
      readyAt: minutesAgo(10),
    });

    const result = await applyOrderAutoCancellation(order as never, {
      readyWithoutCourierWait: READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES,
    });

    expect(result.canceled).toBe(true);
    expect(order.orderStatus).toBe('canceled');
    expect(order.orderPaid).toBe(false);
    expect(order.paid).toBe(false);
    expect(order.courierId).toBeNull();
    expect(order.cancellationReason).toContain('no courier accepted it');
    expect(expireOpenStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('keeps active paid orders when they have not crossed an auto-cancel window', async () => {
    const order = createOrderDocument({
      orderPaid: true,
      paid: true,
      paymentStatus: true,
      orderStatus: 'processing',
      createdAt: minutesAgo(5),
    });

    const result = await applyOrderAutoCancellation(order as never);

    expect(result.canceled).toBe(false);
    expect(order.orderStatus).toBe('processing');
    expect(order.save).not.toHaveBeenCalled();
    expect(notifyOrderAutoCanceled).not.toHaveBeenCalled();
    expect(expireOpenStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('treats any legacy payment flag as paid before stale unpaid cancellation', async () => {
    const order = createOrderDocument({
      orderPaid: false,
      paid: true,
      paymentStatus: false,
      orderStatus: 'placed',
    });

    const result = await applyOrderAutoCancellation(order as never);

    expect(result.canceled).toBe(false);
    expect(order.orderStatus).toBe('placed');
    expect(order.save).not.toHaveBeenCalled();
    expect(notifyOrderAutoCanceled).not.toHaveBeenCalled();
    expect(expireOpenStripeCheckoutSession).not.toHaveBeenCalled();
  });
});
