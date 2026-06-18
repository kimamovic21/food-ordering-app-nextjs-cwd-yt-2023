import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('@/libs/notifications', () => ({
  notifyUserAboutOrderCompletion: vi.fn(),
  notifyOrderDelivered: vi.fn(),
  notifyRestaurantAdminsAboutPaidOrder: vi.fn(),
}));

if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS ||
    'mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests';
}

describe('E2E: Courier lifecycle', () => {
  let customer: any;
  let courier: any;
  let restaurant: any;
  let menuItem: any;
  let order: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /e2e-courier-/i });
    await Order.deleteMany({});
    await Restaurant.deleteMany({ name: /e2e-courier-rest-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-courier-/i });
    await Order.deleteMany({});
    await Restaurant.deleteMany({ name: /e2e-courier-rest-/i });
    await mongoose.disconnect();
  });

  it('full courier flow: availability -> location -> complete order', async () => {
    // create customer
    customer = await User.create({
      name: 'Cust',
      email: `e2e-courier-cust-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'user',
    });

    // create courier user
    courier = await User.create({
      name: 'Courier',
      email: `e2e-courier-courier-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'courier',
      availability: false,
    });

    // create restaurant and menu
    restaurant = await Restaurant.create({
      ownerId: customer._id,
      name: `e2e-courier-rest-${Date.now()}`,
      street: '1',
      city: 'C',
      postalCode: '1000',
      country: 'X',
      latitude: 0,
      longitude: 0,
      contact: '+123456789',
      email: `rest-${Date.now()}@example.com`,
      description: 'Restaurant for courier testing purposes.',
      tax: 10,
      courierFee: 5,
    });
    menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: customer._id,
      name: 'Item',
      category: new mongoose.Types.ObjectId(),
      description: 'A test menu item for courier flow',
      prices: [10],
      sizes: [{ size: 'Regular', price: 10 }],
      image: 'https://example.com/item.jpg',
      isAvailable: true,
    });

    // create order
    order = await Order.create({
      userId: customer._id,
      email: customer.email,
      phone: '123',
      streetAddress: 'a',
      postalCode: 'p',
      city: 'c',
      country: 'ct',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Regular',
          quantity: 1,
          price: 10,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: 10,
      taxAmount: 1,
      deliveryFee: 5,
      total: 16,
      orderPaid: true,
      orderStatus: 'transportation',
      deliveryPin: '123456',
    });

    // assign courier to order
    order.courierId = courier._id;
    await order.save();

    // courier toggles availability
    activeSession = { user: { email: courier.email, role: 'courier' } };
    const { PATCH: ToggleAvailability } = await import('@/app/api/my-delivery/availability/route');
    const availResp = await ToggleAvailability(
      new Request('http://localhost', { method: 'PATCH' })
    );
    expect(availResp.status).toBe(200);
    const availBody = await availResp.json();
    expect(availBody.availability).toBe(true);

    // courier posts location
    const { POST: PostLocation } = await import('@/app/api/my-delivery/location/route');
    const locResp = await PostLocation(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ latitude: 10, longitude: 10 }),
      })
    );
    expect(locResp.status).toBe(200);

    // courier completes order
    const { PATCH: CompleteOrder } = await import('@/app/api/my-delivery/orders/route');
    const completeResp = await CompleteOrder(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id.toString(), deliveryPin: '123456' }),
      })
    );
    expect(completeResp.status).toBe(200);
    const completeBody = await completeResp.json();
    expect(completeBody.order.orderStatus).toBe('delivered');

    // verify order in db
    const updated = await Order.findById(order._id);
    expect(updated?.orderStatus).toBe('delivered');
  });
});
