import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
import { Category } from '@/models/category';
import { Order } from '@/models/order';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Ensure test DB
if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS || 'mongodb://localhost:27017/food-ordering-app-tests-e2e';
}

const sharedConstructEvent = vi.fn();
vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: (...args: any[]) => sharedConstructEvent(...args),
    } as any;
  },
}));

vi.mock('next/headers', () => ({ headers: vi.fn() }));
// Mock notifications and email sending libs to avoid server-only imports in e2e environment
vi.mock('@/libs/notifications', () => ({ notifyRestaurantAdminsAboutPaidOrder: vi.fn() }));
vi.mock('@/app/api/webhook/sendPurchaseReceiptEmail', () => ({
  sendPurchaseReceiptEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

describe('E2E: Checkout -> Webhook integration', () => {
  let userId: mongoose.Types.ObjectId;
  let ownerId: mongoose.Types.ObjectId;
  let restaurantId: mongoose.Types.ObjectId;
  let menuItemId: mongoose.Types.ObjectId;
  let orderId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  afterAll(async () => {
    if (userId) await User.deleteOne({ _id: userId });
    if (ownerId) await User.deleteOne({ _id: ownerId });
    if (restaurantId) await Restaurant.deleteOne({ _id: restaurantId });
    if (menuItemId) await MenuItem.deleteOne({ _id: menuItemId });
    if (orderId) await Order.deleteOne({ _id: orderId });
    await Category.deleteMany({ name: /e2e-checkout-webhook/i });
    await mongoose.connection.close();
  });

  it('marks order as paid when webhook is received', async () => {
    const hashed = bcrypt.hashSync('pass', 10);
    const customer = await User.create({
      name: 'E2E Pay User',
      email: `e2e-pay-${Date.now()}@example.com`,
      password: hashed,
      role: 'user',
      provider: 'credentials',
    });
    userId = customer._id;

    const owner = await User.create({
      name: 'E2E Rest Owner',
      email: `e2e-restowner-${Date.now()}@example.com`,
      password: hashed,
      role: 'admin',
      provider: 'credentials',
    });
    ownerId = owner._id;

    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: 'E2E Pay Restaurant',
      street: '1 Pay St',
      city: 'PayCity',
      postalCode: '11111',
      country: 'Test',
      latitude: 0,
      longitude: 0,
      contact: '+200',
      email: 'pay@example.com',
      description: 'E2E Pay Restaurant for webhook integration test',
      tax: 10,
      courierFee: 5,
    });
    restaurantId = restaurant._id;

    const category = await Category.create({ name: `e2e-checkout-webhook-${Date.now()}` });

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: owner._id,
      name: 'Pay Item',
      category: category._id,
      description: 'Item for webhook test',
      sizes: [{ size: 'Regular', price: 5 }],
      prices: [5],
      image: 'https://example.com/item.jpg',
      isAvailable: true,
    });
    menuItemId = menuItem._id;

    const order = await Order.create({
      userId: customer._id,
      email: customer.email,
      phone: '+300',
      streetAddress: '123 Pay Ave',
      postalCode: '12345',
      city: 'PayCity',
      country: 'Test',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Regular',
          quantity: 1,
          price: 5,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: restaurant.tax,
      taxAmount: 0.5,
      deliveryFee: 5,
      loyaltyDiscount: 0,
      loyaltyDiscountPercentage: 0,
      total: 10.5,
      orderPaid: false,
      paid: false,
      orderStatus: 'placed',
    });
    orderId = order._id;

    // Ensure stripe env vars are present so route constructs mocked Stripe
    process.env.STRIPE_SK = 'sk_test_e2e';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_e2e';

    // Prepare mocks for webhook handler
    // set shared constructEvent to return the simulated event
    sharedConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_e2e_1', metadata: { orderId: order._id.toString() } } },
    } as any);

    const headersMod = await import('next/headers');
    (headersMod.headers as unknown as vi.Mock).mockResolvedValue({ get: () => 'sig_e2e' } as any);

    // Call webhook route POST
    const webhook = await import('@/app/api/webhook/route');
    const POST = webhook.POST as (req: Request) => Promise<Response>;

    const res = await POST(
      new Request('http://localhost/api/webhook', { method: 'POST', body: JSON.stringify({}) })
    );
    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id).lean();
    expect(updated).toBeTruthy();
    expect((updated as any).paid).toBe(true);
    expect((updated as any).orderPaid).toBe(true);
    expect((updated as any).stripeSessionId).toBe('cs_e2e_1');

    // restore mock
    sharedConstructEvent.mockReset();
  });
});
