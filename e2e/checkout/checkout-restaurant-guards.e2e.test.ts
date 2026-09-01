import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const alwaysOpenWorkingHours = () =>
  weekdays.map((day) => ({
    day,
    openTime: '00:00',
    closeTime: '23:59',
    isClosed: false,
  }));

const uniqueEmail = (label: string) =>
  `e2e-checkout-guards-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string }) => {
  activeSession = { user: { email: user.email, role: 'user' } };
};

const createCheckoutFixture = async ({
  itemPrice = 25,
  restaurantOverrides = {},
}: {
  itemPrice?: number;
  restaurantOverrides?: Record<string, unknown>;
} = {}) => {
  const owner = await User.create({
    name: 'Checkout Guard Owner',
    email: uniqueEmail('owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Checkout Guard Customer',
    email: uniqueEmail('customer'),
    password: 'x',
    provider: 'credentials',
    role: 'user',
  });

  const restaurant = await Restaurant.create({
    ownerId: owner._id,
    name: `E2E Checkout Guards Restaurant ${Date.now()}`,
    street: '1 Test Street',
    city: 'Sarajevo',
    postalCode: '71000',
    country: 'BiH',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+38761111222',
    email: `checkout-guards-${Date.now()}@example.com`,
    description: 'Restaurant used for checkout guard e2e tests.',
    tax: 10,
    courierFee: 5,
    minimumOrderAmount: 1,
    deliveryRadiusKm: 10,
    workingHours: alwaysOpenWorkingHours(),
    ...restaurantOverrides,
  });

  owner.restaurantId = restaurant._id;
  await owner.save();

  const category = await Category.create({
    name: `E2E Checkout Guards Category ${Date.now()}`,
  });

  const menuItem = await MenuItem.create({
    restaurantId: restaurant._id,
    adminId: owner._id,
    name: `E2E Checkout Guards Item ${Date.now()}`,
    category: category._id,
    description: 'Menu item used for checkout guard e2e tests.',
    priceType: 'single',
    priceSmall: itemPrice,
    priceMedium: null,
    priceLarge: null,
    image: 'https://example.com/checkout-guard.jpg',
    isAvailable: true,
  });

  return { category, customer, menuItem, owner, restaurant };
};

const checkout = async ({
  customer,
  menuItem,
  restaurant,
  deliveryLatitude = 43.8563,
  deliveryLongitude = 18.4131,
}: {
  customer: any;
  menuItem: any;
  restaurant: any;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}) => {
  setSession(customer);
  const { POST } = await import('@/app/api/checkout/route');
  const body: Record<string, unknown> = {
    phone: '+38761123456',
    streetAddress: 'Customer Street 1',
    postalCode: '71000',
    city: 'Sarajevo',
    country: 'BiH',
    loyaltyDiscountPercentage: 0,
    cartItems: [
      {
        _id: menuItem._id.toString(),
        name: menuItem.name,
        size: 'single',
        price: Number(menuItem.priceSmall),
        quantity: 1,
        restaurantId: restaurant._id.toString(),
      },
    ],
  };

  if (deliveryLatitude !== null) {
    body.deliveryLatitude = deliveryLatitude;
  }

  if (deliveryLongitude !== null) {
    body.deliveryLongitude = deliveryLongitude;
  }

  const response = await POST(
    new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify(body),
    })
  );

  return {
    body: await response.json(),
    response,
  };
};

describe('E2E: checkout restaurant guardrails', () => {
  beforeAll(async () => {
    process.env.STRIPE_SK = 'sk_test_checkout_guards_e2e';
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    stripeCreateSession.mockReset();
    await Order.deleteMany({ email: /e2e-checkout-guards-/i });
    await MenuItem.deleteMany({ name: /^E2E Checkout Guards/i });
    await Category.deleteMany({ name: /^E2E Checkout Guards/i });
    await Restaurant.deleteMany({ name: /^E2E Checkout Guards/i });
    await User.deleteMany({ email: /e2e-checkout-guards-/i });
  });

  afterAll(async () => {
    await Order.deleteMany({ email: /e2e-checkout-guards-/i });
    await MenuItem.deleteMany({ name: /^E2E Checkout Guards/i });
    await Category.deleteMany({ name: /^E2E Checkout Guards/i });
    await Restaurant.deleteMany({ name: /^E2E Checkout Guards/i });
    await User.deleteMany({ email: /e2e-checkout-guards-/i });
    await mongoose.disconnect();
  });

  it('blocks checkout when the restaurant minimum order amount is not reached', async () => {
    const fixture = await createCheckoutFixture({
      itemPrice: 12,
      restaurantOverrides: { minimumOrderAmount: 20 },
    });

    const { body, response } = await checkout(fixture);

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Minimum order amount for this restaurant is $20.00.' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('blocks checkout while the restaurant is paused', async () => {
    const fixture = await createCheckoutFixture({
      restaurantOverrides: {
        isPaused: true,
        pauseReason: 'Kitchen is catching up with current orders.',
      },
    });

    const { body, response } = await checkout(fixture);

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: 'Kitchen is catching up with current orders.' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('requires customer location before checking delivery radius', async () => {
    const fixture = await createCheckoutFixture();

    const { body, response } = await checkout({
      ...fixture,
      deliveryLatitude: null,
      deliveryLongitude: null,
    });

    expect(response.status).toBe(400);
    expect(body.error).toContain('Please use your current location');
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('blocks checkout when the customer is outside the restaurant delivery radius', async () => {
    const fixture = await createCheckoutFixture({
      restaurantOverrides: { deliveryRadiusKm: 10 },
    });

    const { body, response } = await checkout({
      ...fixture,
      deliveryLatitude: 44.8563,
      deliveryLongitude: 19.4131,
    });

    expect(response.status).toBe(400);
    expect(body.error).toContain('This restaurant delivers within 10 km');
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('blocks checkout when today is configured as a blocked date', async () => {
    const fixture = await createCheckoutFixture({
      restaurantOverrides: {
        blockedDates: [{ date: new Date(), reason: 'Closed for e2e testing' }],
      },
    });

    const { body, response } = await checkout(fixture);

    expect(response.status).toBe(409);
    expect(String(body.error)).toMatch(/opens|not accepting/i);
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });
});
