import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';

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

describe('E2E: Checkout stale menu availability', () => {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const customerEmail = `e2e-stale-cart-customer-${runId}@example.com`;
  const adminEmail = `e2e-stale-cart-admin-${runId}@example.com`;
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
    process.env.STRIPE_SK = 'sk_test_stale_cart';
  });

  afterAll(async () => {
    await Order.deleteMany({ email: customerEmail });
    await MenuItem.deleteMany({ name: /^E2E Stale Cart/i });
    await Category.deleteMany({ name: /^E2E Stale Cart/i });
    await Restaurant.deleteMany({ name: /^E2E Stale Cart/i });
    await User.deleteMany({ email: { $in: [customerEmail, adminEmail] } });
  });

  it('rejects checkout when an admin makes a cart item unavailable after it was added', async () => {
    customer = await User.create({
      name: 'Stale Cart Customer',
      email: customerEmail,
      password: 'x',
      provider: 'credentials',
      role: 'user',
    });

    admin = await User.create({
      name: 'Stale Cart Admin',
      email: adminEmail,
      password: 'x',
      provider: 'credentials',
      role: 'admin',
    });

    restaurant = await Restaurant.create({
      ownerId: admin._id,
      name: `E2E Stale Cart Restaurant ${runId}`,
      street: '1',
      city: 'Sarajevo',
      postalCode: '71000',
      country: 'BiH',
      latitude: 43.8563,
      longitude: 18.4131,
      contact: '+38761111222',
      email: `stale-cart-${runId}@example.com`,
      description: 'Restaurant for stale cart menu availability testing.',
      tax: 10,
      courierFee: 5,
    });

    admin.restaurantId = restaurant._id;
    await admin.save();

    category = await Category.create({
      name: `E2E Stale Cart Pizza ${runId}`,
    });

    menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: admin._id,
      name: `E2E Stale Cart Pizza ${runId}`,
      category: category._id,
      description: 'A menu item that becomes unavailable after being added to cart.',
      priceType: 'single',
      priceSmall: 12,
      priceMedium: null,
      priceLarge: null,
      sizes: [{ size: 'single', price: 12 }],
      prices: [12],
      image: 'https://example.com/stale-cart-pizza.jpg',
      isAvailable: true,
    });

    activeSession = { user: { email: admin.email, role: 'admin' } };
    const { PATCH: PatchMenuItem } = await import('@/app/api/menu-items/route');
    const availabilityResp = await PatchMenuItem(
      new Request('http://localhost/api/menu-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: menuItem._id.toString(),
          isAvailable: false,
        }),
      })
    );
    expect(availabilityResp.status).toBe(200);

    const unavailableItem = await MenuItem.findById(menuItem._id).lean();
    expect(unavailableItem?.isAvailable).toBe(false);

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
              size: 'single',
              price: 12,
              quantity: 1,
              restaurantId: restaurant._id.toString(),
            },
          ],
        }),
      })
    );
    const checkoutBody = await checkoutResp.json();

    expect(checkoutResp.status).toBe(400);
    expect(checkoutBody).toEqual({ error: `${menuItem.name} is currently unavailable` });
    expect(stripeCreateSession).not.toHaveBeenCalled();
    await expect(Order.findOne({ email: customer.email })).resolves.toBeNull();
  });
});
