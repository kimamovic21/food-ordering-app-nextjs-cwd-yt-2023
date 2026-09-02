import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

const uniqueEmail = (label: string) =>
  `e2e-restaurant-reports-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string; role: string }) => {
  activeSession = { user: { email: user.email, role: user.role } };
};

const createRestaurant = async (owner: any, label: string) => {
  const restaurant = await Restaurant.create({
    ownerId: owner._id,
    name: `E2E Restaurant Reports ${label} ${Date.now()}`,
    street: '1 Report Street',
    city: 'Sarajevo',
    postalCode: '71000',
    country: 'BiH',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+38761111222',
    email: `restaurant-reports-${label}-${Date.now()}@example.com`,
    description: 'Restaurant used for report route e2e tests.',
    tax: 10,
    courierFee: 5,
  });

  owner.restaurantId = restaurant._id;
  await owner.save();

  return restaurant;
};

const createReportFixture = async () => {
  const owner = await User.create({
    name: 'Restaurant Reports Owner',
    email: uniqueEmail('owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const otherOwner = await User.create({
    name: 'Restaurant Reports Other Owner',
    email: uniqueEmail('other-owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Restaurant Reports Customer',
    email: uniqueEmail('customer'),
    password: 'x',
    provider: 'credentials',
    role: 'user',
  });

  const restaurant = await createRestaurant(owner, 'Main');
  const otherRestaurant = await createRestaurant(otherOwner, 'Other');
  const reportDate = new Date('2026-08-15T12:30:00');

  await Order.create([
    {
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
          name: 'Report Pizza',
          size: 'single',
          quantity: 2,
          price: 10,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: 10,
      taxAmount: 4,
      deliveryFee: 5,
      couponDiscountAmount: 2,
      loyaltyDiscount: 1,
      total: 30,
      orderPaid: true,
      paid: true,
      orderStatus: 'completed',
      createdAt: reportDate,
      updatedAt: reportDate,
    },
    {
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
          name: 'Report Burger',
          size: 'single',
          quantity: 1,
          price: 12,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: 10,
      taxAmount: 0,
      deliveryFee: 5,
      total: 17,
      orderPaid: false,
      paid: false,
      orderStatus: 'placed',
      createdAt: reportDate,
      updatedAt: reportDate,
    },
    {
      userId: customer._id,
      email: customer.email,
      phone: '+38761111111',
      streetAddress: 'Other Customer Street 1',
      postalCode: '71000',
      city: 'Sarajevo',
      country: 'BiH',
      cartProducts: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Other Restaurant Pizza',
          size: 'single',
          quantity: 5,
          price: 50,
          restaurantId: otherRestaurant._id,
        },
      ],
      restaurantId: otherRestaurant._id,
      taxPercentage: 10,
      taxAmount: 5,
      deliveryFee: 5,
      total: 60,
      orderPaid: true,
      paid: true,
      orderStatus: 'completed',
      createdAt: reportDate,
      updatedAt: reportDate,
    },
  ]);

  return { owner, restaurant };
};

const getRestaurantReport = async (query: string) => {
  const { GET } = await import('@/app/api/restaurant/reports/route');

  return GET(new Request(`http://localhost/api/restaurant/reports${query}`));
};

describe('E2E: restaurant reports route', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await Order.deleteMany({ email: /e2e-restaurant-reports-/i });
    await Restaurant.deleteMany({ name: /^E2E Restaurant Reports/i });
    await User.deleteMany({ email: /e2e-restaurant-reports-/i });
  });

  afterAll(async () => {
    await Order.deleteMany({ email: /e2e-restaurant-reports-/i });
    await Restaurant.deleteMany({ name: /^E2E Restaurant Reports/i });
    await User.deleteMany({ email: /e2e-restaurant-reports-/i });
    await mongoose.disconnect();
  });

  it('returns restaurant-scoped daily activity and zero values for empty report periods', async () => {
    const { owner, restaurant } = await createReportFixture();

    setSession(owner);
    const activityResponse = await getRestaurantReport('?period=daily&date=2026-08-15');
    const activityBody = await activityResponse.json();

    expect(activityResponse.status).toBe(200);
    expect(activityBody.restaurant).toEqual({
      _id: restaurant._id.toString(),
      name: restaurant.name,
    });
    expect(activityBody.report.hasActivity).toBe(true);
    expect(activityBody.report.totalOrders).toBe(2);
    expect(activityBody.report.paidOrders).toBe(1);
    expect(activityBody.report.unpaidOrders).toBe(1);
    expect(activityBody.report.completedOrders).toBe(1);
    expect(activityBody.report.activeOrders).toBe(1);
    expect(activityBody.report.totalRevenue).toBe(30);
    expect(activityBody.report.netRevenue).toBe(30);
    expect(activityBody.report.topItems).toEqual([
      {
        name: 'Report Pizza',
        quantity: 2,
        revenue: 20,
      },
    ]);

    const emptyResponse = await getRestaurantReport('?period=daily&date=2026-08-16');
    const emptyBody = await emptyResponse.json();

    expect(emptyResponse.status).toBe(200);
    expect(emptyBody.report.hasActivity).toBe(false);
    expect(emptyBody.report.totalOrders).toBe(0);
    expect(emptyBody.report.totalRevenue).toBe(0);
    expect(emptyBody.report.netRevenue).toBe(0);
    expect(emptyBody.report.paymentRate).toBe(0);
    expect(emptyBody.report.completionRate).toBe(0);
    expect(emptyBody.report.cancellationRate).toBe(0);
    expect(emptyBody.report.topItems).toEqual([]);
  });
});
