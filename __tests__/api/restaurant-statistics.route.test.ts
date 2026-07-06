import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
  },
}));

const createLeanQuery = (result: unknown) => ({
  lean: vi.fn().mockResolvedValue(result),
});

const createSelectLeanQuery = (result: unknown) => ({
  select: vi.fn(() => createLeanQuery(result)),
});

describe('GET /api/restaurant/statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue({
      _id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
      restaurantId: 'restaurant-1',
    } as never);
  });

  it('returns menu performance summaries for the admin restaurant', async () => {
    vi.mocked(Order.find).mockReturnValue(
      createLeanQuery([
        {
          _id: 'order-1',
          userId: { toString: () => 'user-1' },
          orderStatus: 'completed',
          orderPaid: true,
          total: 25,
          cartProducts: [
            {
              productId: { toString: () => 'menu-item-1' },
              name: 'Pizza',
              quantity: 2,
              price: 10,
            },
            {
              productId: { toString: () => 'menu-item-2' },
              name: 'Pasta',
              quantity: 1,
              price: 5,
            },
          ],
        },
        {
          _id: 'order-2',
          userId: { toString: () => 'user-2' },
          orderStatus: 'canceled',
          orderPaid: false,
          total: 10,
          cartProducts: [
            {
              productId: { toString: () => 'menu-item-2' },
              name: 'Pasta',
              quantity: 1,
              price: 10,
            },
          ],
        },
      ]) as never
    );
    vi.mocked(MenuItem.find).mockReturnValue(
      createSelectLeanQuery([
        { _id: { toString: () => 'menu-item-1' }, name: 'Pizza' },
        { _id: { toString: () => 'menu-item-2' }, name: 'Pasta' },
        { _id: { toString: () => 'menu-item-3' }, name: 'Salad' },
      ]) as never
    );

    const { GET } = await import('@/app/api/restaurant/statistics/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.statistics.menuPerformance.totalMenuItems).toBe(3);
    expect(body.statistics.menuPerformance.totalMenuRevenue).toBe(25);
    expect(body.statistics.menuPerformance.topSellingItems[0]).toEqual(
      expect.objectContaining({
        menuItemId: 'menu-item-1',
        name: 'Pizza',
        quantitySold: 2,
        revenue: 20,
      })
    );
    expect(body.statistics.menuPerformance.leastOrderedItems[0]).toEqual(
      expect.objectContaining({ menuItemId: 'menu-item-3', quantitySold: 0 })
    );
    expect(body.statistics.menuPerformance.mostCanceledItems[0]).toEqual(
      expect.objectContaining({ menuItemId: 'menu-item-2', canceledQuantity: 1 })
    );
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });
});
