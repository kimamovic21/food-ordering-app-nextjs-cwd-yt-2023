import { headers } from 'next/headers';
import { Order } from '@/models/order';
import { notifyRestaurantAdminsAboutPaidOrder } from '@/libs/notifications';
import { sendPurchaseReceiptEmail } from '@/app/api/webhook/sendPurchaseReceiptEmail';

const stripeConstructEvent = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = { constructEvent: stripeConstructEvent } as any;
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifyRestaurantAdminsAboutPaidOrder: vi.fn(),
}));

vi.mock('@/app/api/webhook/sendPurchaseReceiptEmail', () => ({
  sendPurchaseReceiptEmail: vi.fn(),
}));

const loadWebhookRoute = async () => {
  const mod = await import('@/app/api/webhook/route');
  return mod.POST;
};

describe('POST /api/webhook (receipt idempotency)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_webhook';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook';

    vi.mocked(headers).mockResolvedValue({
      get: vi.fn((name: string) => (name === 'stripe-signature' ? 'sig_test_1' : null)),
    } as never);

    stripeConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_99',
          metadata: { orderId: 'order-99' },
        },
      },
    });
  });

  it('does not resend receipt email when receiptEmailSentAt is already set', async () => {
    const orderDocument = {
      _id: { toString: () => 'order-99' },
      restaurantId: 'restaurant-1',
      email: 'customer@example.com',
      couponId: null,
      cartProducts: [],
      taxAmount: 0,
      deliveryFee: 0,
      total: 10,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      orderPaid: true,
      paid: true,
      orderStatus: 'processing',
      stripeSessionId: 'cs_test_webhook_99',
      receiptEmailSentAt: new Date('2026-01-01T00:02:00.000Z'),
      save: vi.fn(async function save(this: Record<string, unknown>) {}),
    };

    vi.mocked(Order.findById).mockResolvedValue(orderDocument as never);

    const POST = await loadWebhookRoute();

    const response = await POST(
      new Request('http://localhost/api/webhook', { method: 'POST', body: JSON.stringify({}) })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });

    expect(notifyRestaurantAdminsAboutPaidOrder).not.toHaveBeenCalled();
    expect(sendPurchaseReceiptEmail).not.toHaveBeenCalled();
  });
});
