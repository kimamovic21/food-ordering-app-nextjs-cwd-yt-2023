import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { AuditLog } from '@/models/auditLog';
import { Notification } from '@/models/notification';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

let activeSession: any = null;
let originalSuperAdminEmail: string | undefined;
let originalPublicSuperAdminEmail: string | undefined;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

const uniqueEmail = (label: string) =>
  `e2e-failed-delivery-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string; role: string }) => {
  activeSession = { user: { email: user.email, role: user.role } };
};

const createFailedDeliveryFixture = async (transportStartedAt: Date) => {
  const customer = await User.create({
    name: 'Failed Delivery Customer',
    email: uniqueEmail('customer'),
    password: 'x',
    provider: 'credentials',
    role: 'user',
  });

  const owner = await User.create({
    name: 'Failed Delivery Owner',
    email: uniqueEmail('owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const superAdmin = await User.create({
    name: 'Failed Delivery Super Admin',
    email: uniqueEmail('super-admin'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  process.env.SUPER_ADMIN_EMAIL = superAdmin.email;
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = superAdmin.email;

  const courier = await User.create({
    name: 'Failed Delivery Courier',
    email: uniqueEmail('courier'),
    password: 'x',
    provider: 'credentials',
    role: 'courier',
    availability: true,
  });

  const restaurant = await Restaurant.create({
    ownerId: owner._id,
    name: `E2E Failed Delivery Restaurant ${Date.now()}`,
    street: '1 Test Street',
    city: 'Sarajevo',
    postalCode: '71000',
    country: 'BiH',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+38761111222',
    email: `failed-delivery-${Date.now()}@example.com`,
    description: 'Restaurant used for failed delivery e2e tests.',
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
        name: 'Failed Delivery Pizza',
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
    orderPaid: true,
    paid: true,
    orderStatus: 'transportation',
    courierId: courier._id,
    courierAssignmentStatus: 'accepted',
    restaurantHandedToCourierAt: transportStartedAt,
    courierPickedUpAt: transportStartedAt,
    transportationAt: transportStartedAt,
    deliveryPin: '123456',
  });

  courier.takenOrder = order._id;
  await courier.save();

  return { courier, customer, order, owner, restaurant, superAdmin };
};

const courierOrderAction = async (body: Record<string, unknown>) => {
  const { PATCH } = await import('@/app/api/my-delivery/orders/route');

  return PATCH(
    new Request('http://localhost/api/my-delivery/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
};

const adminOrderAction = async (body: Record<string, unknown>) => {
  const { PATCH } = await import('@/app/api/orders/route');

  return PATCH(
    new Request('http://localhost/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
};

describe('E2E: failed delivery cancellation', () => {
  beforeAll(async () => {
    originalSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    originalPublicSuperAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await AuditLog.deleteMany({ action: 'order.failed_delivery_canceled' });
    await Notification.deleteMany({});
    await Order.deleteMany({ email: /e2e-failed-delivery-/i });
    await Restaurant.deleteMany({ name: /^E2E Failed Delivery/i });
    await User.deleteMany({ email: /e2e-failed-delivery-/i });
  });

  afterAll(async () => {
    await AuditLog.deleteMany({ action: 'order.failed_delivery_canceled' });
    await Notification.deleteMany({});
    await Order.deleteMany({ email: /e2e-failed-delivery-/i });
    await Restaurant.deleteMany({ name: /^E2E Failed Delivery/i });
    await User.deleteMany({ email: /e2e-failed-delivery-/i });

    if (originalSuperAdminEmail === undefined) {
      delete process.env.SUPER_ADMIN_EMAIL;
    } else {
      process.env.SUPER_ADMIN_EMAIL = originalSuperAdminEmail;
    }

    if (originalPublicSuperAdminEmail === undefined) {
      delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    } else {
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = originalPublicSuperAdminEmail;
    }

    await mongoose.disconnect();
  });

  it('blocks early customer-unavailable reports and lets the restaurant owner verify a valid one', async () => {
    const { courier, customer, order, owner } = await createFailedDeliveryFixture(new Date());

    setSession(courier);
    const earlyResponse = await courierOrderAction({
      orderId: order._id.toString(),
      action: 'request-failed-delivery',
      reason: 'Customer is not responding.',
    });
    const earlyBody = await earlyResponse.json();

    expect(earlyResponse.status).toBe(400);
    expect(earlyBody.error).toBe(
      'You can request failed delivery cancellation after 30 minutes in transport.'
    );
    expect(earlyBody.remainingMinutes).toBeGreaterThan(0);

    const pastTransportStartedAt = new Date(Date.now() - 31 * 60 * 1000);
    await Order.findByIdAndUpdate(order._id, {
      courierPickedUpAt: pastTransportStartedAt,
      transportationAt: pastTransportStartedAt,
    });

    const requestResponse = await courierOrderAction({
      orderId: order._id.toString(),
      action: 'request-failed-delivery',
      reason: 'Customer is still unavailable.',
    });
    const requestBody = await requestResponse.json();

    expect(requestResponse.status).toBe(200);
    expect(requestBody.order.failedDeliveryReason).toBe('Customer is still unavailable.');

    const ownerReviewNotification = await Notification.findOne({
      recipientUserId: owner._id,
      orderId: order._id,
      title: 'Failed delivery needs review',
    }).lean();
    expect(ownerReviewNotification?.metadata?.failedDeliveryRequested).toBe(true);

    setSession(owner);
    const verifyResponse = await adminOrderAction({
      id: order._id.toString(),
      action: 'verify-failed-delivery',
    });
    const verifyBody = await verifyResponse.json();
    const updatedOrder = await Order.findById(order._id).lean();
    const updatedCourier = await User.findById(courier._id).lean();

    expect(verifyResponse.status).toBe(200);
    expect(verifyBody.order.orderStatus).toBe('canceled');
    expect(updatedOrder?.orderPaid).toBe(false);
    expect(updatedOrder?.paid).toBe(false);
    expect(updatedOrder?.canceledBy).toBe('restaurant_owner');
    expect(updatedOrder?.failedDeliveryVerifiedByRole).toBe('restaurant_owner');
    expect(updatedCourier?.takenOrder).toBeNull();

    await expect(
      Notification.findOne({
        recipientUserId: customer._id,
        orderId: order._id,
        title: 'Order canceled',
      })
    ).resolves.toBeTruthy();
    await expect(
      Notification.findOne({
        recipientUserId: courier._id,
        orderId: order._id,
        title: 'Failed delivery verified',
      })
    ).resolves.toBeTruthy();
  });

  it('lets the super admin verify a valid failed-delivery cancellation', async () => {
    const transportStartedAt = new Date(Date.now() - 31 * 60 * 1000);
    const { courier, order, superAdmin } = await createFailedDeliveryFixture(transportStartedAt);

    setSession(courier);
    const requestResponse = await courierOrderAction({
      orderId: order._id.toString(),
      action: 'request-failed-delivery',
      reason: 'Customer phone is unreachable.',
    });
    expect(requestResponse.status).toBe(200);

    setSession(superAdmin);
    const verifyResponse = await adminOrderAction({
      id: order._id.toString(),
      action: 'verify-failed-delivery',
    });
    const verifyBody = await verifyResponse.json();
    const updatedOrder = await Order.findById(order._id).lean();

    expect(verifyResponse.status).toBe(200);
    expect(verifyBody.order.orderStatus).toBe('canceled');
    expect(updatedOrder?.canceledBy).toBe('super_admin');
    expect(updatedOrder?.failedDeliveryVerifiedByRole).toBe('super_admin');
    await expect(
      Notification.findOne({
        recipientUserId: courier._id,
        orderId: order._id,
        title: 'Failed delivery verified',
      })
    ).resolves.toBeTruthy();
  });
});
