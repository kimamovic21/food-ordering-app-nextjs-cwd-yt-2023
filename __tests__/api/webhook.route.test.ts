import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { Coupon } from '@/models/coupon';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
import { notifyRestaurantAdminsAboutPaidOrder } from '@/libs/notifications';
import { sendPurchaseReceiptEmail } from '@/app/api/webhook/sendPurchaseReceiptEmail';

const stripeConstructEvent = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: stripeConstructEvent,
    };
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: class {
        value: string;

        constructor(value: string) {
          this.value = value;
        }

        toString() {
          return this.value;
        }

        static isValid() {
          return true;
        }
      },
    },
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/coupon', () => ({
  Coupon: {
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
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

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_webhook';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook';

    vi.mocked(headers).mockResolvedValue({
      get: vi.fn((name: string) => (name === 'stripe-signature' ? 'sig_test_1' : null)),
    } as never);

    vi.mocked(sendPurchaseReceiptEmail).mockResolvedValue({ sent: true } as never);

    vi.mocked(Restaurant.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          name: 'Test Restaurant',
          email: 'restaurant@example.com',
          contact: '+123456',
          street: 'Street 1',
          city: 'Sarajevo',
          postalCode: '71000',
          country: 'BiH',
        }),
      }),
    } as never);

    vi.mocked(MenuItem.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            image: 'https://example.com/item.jpg',
          },
        ]),
      }),
    } as never);

    stripeConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_1',
          metadata: {
            orderId: 'order-1',
          },
        },
      },
    });
  });

  it('returns 400 when stripe signature header is missing', async () => {
    vi.mocked(headers).mockResolvedValueOnce({
      get: vi.fn(() => null),
    } as never);

    const POST = await loadWebhookRoute();
    const response = await POST(new Request('http://localhost/api/webhook', { method: 'POST' }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain('Missing Stripe signature');
    expect(Order.findById).not.toHaveBeenCalled();
  });

  it('returns 400 when stripe signature verification fails', async () => {
    stripeConstructEvent.mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const POST = await loadWebhookRoute();
    const response = await POST(
      new Request('http://localhost/api/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain('Webhook Error');
    expect(Order.findById).not.toHaveBeenCalled();
  });

  it('ignores duplicate checkout.session.completed events for side effects', async () => {
    const orderDocument = {
      _id: { toString: () => 'order-1' },
      restaurantId: 'restaurant-1',
      email: 'customer@example.com',
      couponId: 'coupon-1',
      couponDiscountAmount: 3,
      cartProducts: [
        {
          productId: 'menu-item-1',
          name: 'Pizza',
          size: 'Large',
          quantity: 1,
          price: 12,
        },
      ],
      taxAmount: 1,
      deliveryFee: 2,
      specialInstructions: 'Cut pizza into small slices.',
      total: 15,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      orderPaid: false,
      paid: false,
      orderStatus: '',
      stripeSessionId: null,
      receiptEmailSentAt: null,
      save: vi.fn(async function save(this: Record<string, unknown>) {
        if (this.paid) {
          this.receiptEmailSentAt = this.receiptEmailSentAt || new Date('2026-01-01T00:01:00.000Z');
        }
      }),
    };

    vi.mocked(Order.findById).mockResolvedValue(orderDocument as never);

    const POST = await loadWebhookRoute();

    await POST(
      new Request('http://localhost/api/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    await POST(
      new Request('http://localhost/api/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    expect(orderDocument.paid).toBe(true);
    expect(orderDocument.orderPaid).toBe(true);
    expect(orderDocument.stripeSessionId).toBe('cs_test_webhook_1');

    expect(notifyRestaurantAdminsAboutPaidOrder).toHaveBeenCalledTimes(1);
    expect(Coupon.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(sendPurchaseReceiptEmail).toHaveBeenCalledTimes(1);
    expect(sendPurchaseReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        specialInstructions: 'Cut pizza into small slices.',
      })
    );
  });

  it('returns success and does not mutate orders when metadata.orderId is missing', async () => {
    stripeConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_2',
          metadata: {},
        },
      },
    });

    const POST = await loadWebhookRoute();

    const response = await POST(
      new Request('http://localhost/api/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(Order.findById).not.toHaveBeenCalled();
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
});
