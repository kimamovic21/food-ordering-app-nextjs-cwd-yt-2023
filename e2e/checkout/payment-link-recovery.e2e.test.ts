import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

const stripeRetrieveSession = vi.hoisted(() => vi.fn());
const stripeCreateSession = vi.hoisted(() => vi.fn());

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: stripeCreateSession,
        retrieve: stripeRetrieveSession,
      },
    };
  },
}));

const uniqueEmail = (label: string) =>
  `e2e-payment-link-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string }) => {
  activeSession = { user: { email: user.email, role: 'user' } };
};

const createPaymentLinkFixture = async (stripeSessionId?: string | null) => {
  const owner = await User.create({
    name: 'Payment Link Owner',
    email: uniqueEmail('owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Payment Link Customer',
    email: uniqueEmail('customer'),
    password: 'x',
    provider: 'credentials',
    role: 'user',
  });

  const restaurant = await Restaurant.create({
    ownerId: owner._id,
    name: `E2E Payment Link Restaurant ${Date.now()}`,
    street: '1 Test Street',
    city: 'Sarajevo',
    postalCode: '71000',
    country: 'BiH',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+38761111222',
    email: `payment-link-${Date.now()}@example.com`,
    description: 'Restaurant used for payment link recovery e2e tests.',
    tax: 10,
    courierFee: 5,
  });

  owner.restaurantId = restaurant._id;
  await owner.save();

  const order = await Order.create({
    userId: customer._id,
    email: customer.email,
    phone: '+38761111111',
    streetAddress: 'Customer Street 1',
    postalCode: '71000',
    city: 'Sarajevo',
    country: 'BiH',
    cartProducts: [
      {
        productId: new mongoose.Types.ObjectId(),
        name: 'Payment Link Pizza',
        size: 'single',
        quantity: 1,
        price: 20,
        restaurantId: restaurant._id,
      },
    ],
    restaurantId: restaurant._id,
    taxPercentage: 10,
    taxAmount: 2,
    deliveryFee: 5,
    total: 27,
    orderPaid: false,
    paid: false,
    orderStatus: 'placed',
    stripeSessionId: stripeSessionId || undefined,
  });

  return { customer, order, owner, restaurant };
};

const getPaymentLink = async (orderId: mongoose.Types.ObjectId | string) => {
  const { GET } = await import('@/app/api/payment-link/route');

  return GET(
    new Request(`http://localhost/api/payment-link?orderId=${orderId.toString()}`, {
      headers: { origin: 'http://localhost:3000' },
    })
  );
};

describe('E2E: payment link recovery', () => {
  beforeAll(async () => {
    process.env.STRIPE_SK = 'sk_test_payment_link_e2e';
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    stripeRetrieveSession.mockReset();
    stripeCreateSession.mockReset();
    await Order.deleteMany({ email: /e2e-payment-link-/i });
    await Restaurant.deleteMany({ name: /^E2E Payment Link/i });
    await User.deleteMany({ email: /e2e-payment-link-/i });
  });

  afterAll(async () => {
    await Order.deleteMany({ email: /e2e-payment-link-/i });
    await Restaurant.deleteMany({ name: /^E2E Payment Link/i });
    await User.deleteMany({ email: /e2e-payment-link-/i });
    await mongoose.disconnect();
  });

  it('returns the existing open Stripe Checkout URL for an unpaid placed order', async () => {
    const { customer, order } = await createPaymentLinkFixture('cs_open_e2e');
    stripeRetrieveSession.mockResolvedValueOnce({
      id: 'cs_open_e2e',
      payment_status: 'unpaid',
      status: 'open',
      url: 'https://checkout.stripe.test/open-session',
    });

    setSession(customer);
    const response = await getPaymentLink(order._id);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      url: 'https://checkout.stripe.test/open-session',
      paymentLinkStatus: 'reused',
    });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('creates and saves a replacement Checkout session when Stripe cannot find the old one', async () => {
    const { customer, order } = await createPaymentLinkFixture('cs_missing_e2e');
    stripeRetrieveSession.mockRejectedValueOnce({ code: 'resource_missing', statusCode: 404 });
    stripeCreateSession.mockResolvedValueOnce({
      id: 'cs_recovered_e2e',
      url: 'https://checkout.stripe.test/recovered-session',
    });

    setSession(customer);
    const response = await getPaymentLink(order._id);
    const body = await response.json();
    const updatedOrder = await Order.findById(order._id).lean();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      url: 'https://checkout.stripe.test/recovered-session',
      paymentLinkStatus: 'refreshed',
    });
    expect(stripeCreateSession).toHaveBeenCalledTimes(1);
    expect(updatedOrder?.stripeSessionId).toBe('cs_recovered_e2e');
  });

  it('marks the order as paid when Stripe says the saved session is already paid', async () => {
    const { customer, order } = await createPaymentLinkFixture('cs_paid_e2e');
    stripeRetrieveSession.mockResolvedValueOnce({
      id: 'cs_paid_e2e',
      payment_status: 'paid',
      status: 'complete',
    });

    setSession(customer);
    const response = await getPaymentLink(order._id);
    const body = await response.json();
    const updatedOrder = await Order.findById(order._id).lean();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      paid: true,
      message: 'Payment was already completed. Your order has been updated.',
    });
    expect(updatedOrder?.orderPaid).toBe(true);
    expect(updatedOrder?.paid).toBe(true);
  });
});
