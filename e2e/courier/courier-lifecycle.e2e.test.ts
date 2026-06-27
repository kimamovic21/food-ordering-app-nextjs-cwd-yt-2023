import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(async () => activeSession?.user?.role === 'admin'),
}));

vi.mock('@/libs/notifications', () => ({
  notifyUserAboutOrderCompletion: vi.fn(),
  notifyOrderDelivered: vi.fn(),
  notifyRestaurantAdminsAboutPaidOrder: vi.fn(),
  notifyCourierAboutAssignment: vi.fn(),
  notifyCourierAboutRestaurantHandoff: vi.fn(),
  notifyRestaurantAdminsAboutCourierAssignmentUpdate: vi.fn(),
  notifyUserAboutOrderStatusChange: vi.fn(),
}));

if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS ||
    'mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests';
}

describe('E2E: Courier lifecycle', () => {
  let customer: any;
  let admin: any;
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
    await MenuItem.deleteMany({ description: /courier flow/i });
    await Restaurant.deleteMany({ name: /e2e-courier-rest-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-courier-/i });
    await Order.deleteMany({});
    await MenuItem.deleteMany({ description: /courier flow/i });
    await Restaurant.deleteMany({ name: /e2e-courier-rest-/i });
    await mongoose.disconnect();
  });

  it('full courier flow: availability -> kitchen phases -> courier PIN handoff -> customer confirmation', async () => {
    // create customer
    customer = await User.create({
      name: 'Cust',
      email: `e2e-courier-cust-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'user',
    });

    admin = await User.create({
      name: 'Admin',
      email: `e2e-courier-admin-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'admin',
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
      ownerId: admin._id,
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

    admin.restaurantId = restaurant._id;
    await admin.save();

    menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: admin._id,
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
      orderStatus: 'placed',
      deliveryPin: '123456',
    });

    // courier toggles availability
    activeSession = { user: { email: courier.email, role: 'courier' } };
    const { PATCH: ToggleAvailability } = await import('@/app/api/my-delivery/availability/route');
    const availResp = await ToggleAvailability(
      new Request('http://localhost', { method: 'PATCH' })
    );
    expect(availResp.status).toBe(200);
    const availBody = await availResp.json();
    expect(availBody.availability).toBe(true);

    // restaurant admin moves the order through preparation phases
    activeSession = { user: { email: admin.email, role: 'admin' } };
    const { PATCH: PatchOrderStatus } = await import('@/app/api/orders/route');

    const processingResp = await PatchOrderStatus(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order._id.toString(), orderStatus: 'processing' }),
      })
    );
    expect(processingResp.status).toBe(200);

    const readyResp = await PatchOrderStatus(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order._id.toString(), orderStatus: 'ready' }),
      })
    );
    expect(readyResp.status).toBe(200);

    // admin assigns an available courier, creating a pending assignment
    const { PATCH: AssignCourier } = await import('@/app/api/my-delivery/route');
    const assignResp = await AssignCourier(
      new Request('http://localhost/api/my-delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId: courier._id.toString(),
          orderId: order._id.toString(),
        }),
      })
    );
    expect(assignResp.status).toBe(200);

    // courier accepts the assignment
    activeSession = { user: { email: courier.email, role: 'courier' } };
    const { PATCH: DeliveryOrderAction } = await import('@/app/api/my-delivery/orders/route');
    const acceptResp = await DeliveryOrderAction(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id.toString(), action: 'accept-assignment' }),
      })
    );
    expect(acceptResp.status).toBe(200);
    const acceptBody = await acceptResp.json();
    expect(acceptBody.order.courierAssignmentStatus).toBe('accepted');

    // restaurant records the courier handoff
    activeSession = { user: { email: admin.email, role: 'admin' } };
    const handoffResp = await PatchOrderStatus(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order._id.toString(), action: 'handoff-to-courier' }),
      })
    );
    expect(handoffResp.status).toBe(200);

    // courier posts location and marks the order as picked up
    activeSession = { user: { email: courier.email, role: 'courier' } };
    const { POST: PostLocation } = await import('@/app/api/my-delivery/location/route');
    const locResp = await PostLocation(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ latitude: 10, longitude: 10 }),
      })
    );
    expect(locResp.status).toBe(200);

    const pickupResp = await DeliveryOrderAction(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id.toString(), action: 'pick-up' }),
      })
    );
    expect(pickupResp.status).toBe(200);
    const pickupBody = await pickupResp.json();
    expect(pickupBody.order.orderStatus).toBe('transportation');

    // courier confirms handoff with customer PIN
    const completeResp = await DeliveryOrderAction(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id.toString(), deliveryPin: '123456' }),
      })
    );
    expect(completeResp.status).toBe(200);
    const completeBody = await completeResp.json();
    expect(completeBody.order.orderStatus).toBe('delivered');
    expect(completeBody.order.deliveryPin).toBeUndefined();

    // customer confirms final delivery completion
    activeSession = { user: { email: customer.email, role: 'user' } };
    const { PATCH: PatchMyOrder } = await import('@/app/api/my-orders/route');
    const confirmResp = await PatchMyOrder(
      new Request('http://localhost/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id.toString(), action: 'confirm-delivery' }),
      })
    );
    expect(confirmResp.status).toBe(200);
    const confirmBody = await confirmResp.json();
    expect(confirmBody.order.orderStatus).toBe('completed');
    expect(confirmBody.order.deliveryCompletedBy).toBe('customer');

    const updated = await Order.findById(order._id);
    expect(updated?.orderStatus).toBe('completed');
    expect(updated?.processingAt).toBeTruthy();
    expect(updated?.readyAt).toBeTruthy();
    expect(updated?.courierAcceptedAt).toBeTruthy();
    expect(updated?.restaurantHandedToCourierAt).toBeTruthy();
    expect(updated?.courierPickedUpAt).toBeTruthy();
    expect(updated?.transportationAt).toBeTruthy();
    expect(updated?.courierDeliveredAt).toBeTruthy();
    expect(updated?.customerConfirmedDeliveryAt).toBeTruthy();
    expect(updated?.completedAt).toBeTruthy();
  });

  it('lets the owning restaurant admin complete a delivered order when the customer does not confirm', async () => {
    customer = await User.create({
      name: 'Fallback Cust',
      email: `e2e-courier-fallback-cust-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'user',
    });

    admin = await User.create({
      name: 'Fallback Admin',
      email: `e2e-courier-fallback-admin-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'admin',
    });

    restaurant = await Restaurant.create({
      ownerId: admin._id,
      name: `e2e-courier-rest-fallback-${Date.now()}`,
      street: '1',
      city: 'C',
      postalCode: '1000',
      country: 'X',
      latitude: 0,
      longitude: 0,
      contact: '+123456789',
      email: `rest-fallback-${Date.now()}@example.com`,
      description: 'Restaurant for admin fallback delivery testing.',
      tax: 10,
      courierFee: 5,
    });

    admin.restaurantId = restaurant._id;
    await admin.save();

    const deliveredOrder = await Order.create({
      userId: customer._id,
      email: customer.email,
      phone: '123',
      streetAddress: 'a',
      postalCode: 'p',
      city: 'c',
      country: 'ct',
      cartProducts: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Fallback Item',
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
      orderStatus: 'delivered',
      courierDeliveredAt: new Date(),
      deliveryPin: '654321',
    });

    const otherAdmin = await User.create({
      name: 'Other Fallback Admin',
      email: `e2e-courier-other-admin-${Date.now()}@example.com`,
      password: 'x',
      provider: 'credentials',
      role: 'admin',
    });

    const otherRestaurant = await Restaurant.create({
      ownerId: otherAdmin._id,
      name: `e2e-courier-rest-other-${Date.now()}`,
      street: '2',
      city: 'C',
      postalCode: '1000',
      country: 'X',
      latitude: 0,
      longitude: 0,
      contact: '+123456789',
      email: `rest-other-${Date.now()}@example.com`,
      description: 'Restaurant that should not be able to complete another restaurant order.',
      tax: 10,
      courierFee: 5,
    });

    otherAdmin.restaurantId = otherRestaurant._id;
    await otherAdmin.save();

    const { PATCH: PatchOrderStatus } = await import('@/app/api/orders/route');

    activeSession = { user: { email: otherAdmin.email, role: 'admin' } };
    const blockedResp = await PatchOrderStatus(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deliveredOrder._id.toString(), orderStatus: 'completed' }),
      })
    );
    expect(blockedResp.status).toBe(404);
    await expect(Order.findById(deliveredOrder._id)).resolves.toMatchObject({
      orderStatus: 'delivered',
    });

    activeSession = { user: { email: admin.email, role: 'admin' } };
    const completeResp = await PatchOrderStatus(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deliveredOrder._id.toString(), orderStatus: 'completed' }),
      })
    );
    expect(completeResp.status).toBe(200);
    const completeBody = await completeResp.json();
    expect(completeBody.order.orderStatus).toBe('completed');
    expect(completeBody.order.deliveryCompletedBy).toBe('admin');

    const updated = await Order.findById(deliveredOrder._id);
    expect(updated?.orderStatus).toBe('completed');
    expect(updated?.adminConfirmedDeliveryAt).toBeTruthy();
    expect(updated?.completedAt).toBeTruthy();
  });
});
