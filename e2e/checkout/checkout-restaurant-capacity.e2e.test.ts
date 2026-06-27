import mongoose from 'mongoose';
import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

const stripeCreateSession = vi.hoisted(() => vi.fn());

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(async () => activeSession?.user?.role === 'admin'),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: stripeCreateSession,
      },
    };
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifyOrderPlaced: vi.fn(),
}));

describe('E2E: Checkout restaurant active order capacity', () => {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const customerEmail = `e2e-busy-restaurant-customer-${runId}@example.com`;
  const adminEmail = `e2e-busy-restaurant-admin-${runId}@example.com`;
  const existingOrderEmail = `e2e-busy-restaurant-existing-${runId}@example.com`;
  let customer: any;
  let admin: any;
  let restaurant: any;
  let category: any;
  let menuItem: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    activeSession = null;
    process.env.STRIPE_SK = 'sk_test_busy_restaurant';
  });

  afterAll(async () => {
    if (restaurant?._id) {
      await Order.deleteMany({ restaurantId: restaurant._id });
    }
    await Order.deleteMany({
      email: { $in: [customerEmail, existingOrderEmail] },
    });
    await MenuItem.deleteMany({ name: /^E2E Busy Restaurant/i });
    await Category.deleteMany({ name: /^E2E Busy Restaurant/i });
    await Restaurant.deleteMany({ name: /^E2E Busy Restaurant/i });
    await User.deleteMany({ email: { $in: [customerEmail, adminEmail] } });
  });

  it('rejects checkout when the restaurant already reached its active order limit', async () => {
    customer = await User.create({
      name: 'Busy Restaurant Customer',
      email: customerEmail,
      password: 'x',
      provider: 'credentials',
      role: 'user',
    });

    admin = await User.create({
      name: 'Busy Restaurant Admin',
      email: adminEmail,
      password: 'x',
      provider: 'credentials',
      role: 'admin',
    });

    restaurant = await Restaurant.create({
      ownerId: admin._id,
      name: `E2E Busy Restaurant ${runId}`,
      street: '1',
      city: 'Sarajevo',
      postalCode: '71000',
      country: 'BiH',
      latitude: 43.8563,
      longitude: 18.4131,
      contact: '+38761111222',
      email: `busy-restaurant-${runId}@example.com`,
      description: 'Restaurant for active order capacity checkout testing.',
      tax: 10,
      courierFee: 5,
      averagePreparationMinutes: 30,
      averageDeliveryMinutes: 20,
      activeOrderLimit: 1,
    });

    admin.restaurantId = restaurant._id;
    await admin.save();

    category = await Category.create({
      name: `E2E Busy Restaurant Pizza ${runId}`,
    });

    menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: admin._id,
      name: `E2E Busy Restaurant Pizza ${runId}`,
      category: category._id,
      description: 'A menu item used to verify active order capacity checks.',
      priceType: 'single',
      priceSmall: 12,
      priceMedium: null,
      priceLarge: null,
      sizes: [{ size: 'Regular', price: 12 }],
      prices: [12],
      image: 'https://example.com/busy-restaurant-pizza.jpg',
      isAvailable: true,
    });

    await Order.create({
      userId: customer._id,
      email: existingOrderEmail,
      phone: '+38761111111',
      streetAddress: 'Existing Street 1',
      postalCode: '71000',
      city: 'Sarajevo',
      country: 'BiH',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Regular',
          quantity: 1,
          price: 12,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: 10,
      taxAmount: 1.2,
      deliveryFee: 5,
      total: 17,
      orderPaid: true,
      orderStatus: 'processing',
    });

    activeSession = { user: { email: customer.email, role: 'user' } };
    const { POST: Checkout } = await import('@/app/api/checkout/route');
    const checkoutResp = await Checkout(
      new Request('http://localhost/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          phone: '+38761123456',
          streetAddress: 'Street 1',
          postalCode: '71000',
          city: 'Sarajevo',
          country: 'BiH',
          deliveryLatitude: 43.8563,
          deliveryLongitude: 18.4131,
          loyaltyDiscountPercentage: 0,
          cartItems: [
            {
              _id: menuItem._id.toString(),
              name: menuItem.name,
              size: 'Regular',
              price: 12,
              quantity: 1,
              restaurantId: restaurant._id.toString(),
            },
          ],
        }),
      })
    );
    const checkoutBody = await checkoutResp.json();

    expect(checkoutResp.status).toBe(409);
    expect(checkoutBody).toEqual({
      error: 'This restaurant is very busy at the moment. Please wait a little bit and try again.',
    });
    expect(stripeCreateSession).not.toHaveBeenCalled();
    await expect(Order.findOne({ email: customer.email })).resolves.toBeNull();
  });
});
