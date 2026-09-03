import { getServerSession } from 'next-auth/next';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
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

vi.mock('@/models/notification', () => ({
  Notification: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/libs/courierAssignmentTimeout', () => ({
  applyCourierAssignmentTimeout: vi.fn(async (order) => ({ order, expired: false, reason: '' })),
}));

vi.mock('@/libs/orderAutoCancellation', () => ({
  applyOrderAutoCancellation: vi.fn(async (order) => ({ order, canceled: false, reason: '' })),
  isReadyWithoutCourierLate: vi.fn(() => false),
}));

vi.mock('@/libs/notifications', () => ({
  notifyRestaurantAdminsAboutLateOrder: vi.fn(),
}));

const createFindOneQuery = (value: unknown) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const createOrderFindQuery = (orders: unknown[]) => {
  const query = {
    populate: vi.fn(() => query),
    sort: vi.fn().mockResolvedValue(orders),
  };

  return query;
};

describe('GET /api/orders/queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockReturnValue(
      createFindOneQuery({
        _id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        restaurantId: 'restaurant-1',
      }) as never
    );
  });

  it('marks ready orders whose courier assignment expired', async () => {
    const order = {
      _id: { toString: () => 'order-1' },
      email: 'customer@example.com',
      orderStatus: 'ready',
      orderPaid: true,
      paid: true,
      total: 24,
      createdAt: new Date(),
      courierAssignmentStatus: 'expired',
      cartProducts: [],
      toObject() {
        return {
          _id: 'order-1',
          email: this.email,
          orderStatus: this.orderStatus,
          orderPaid: this.orderPaid,
          paid: this.paid,
          total: this.total,
          createdAt: this.createdAt,
          courierAssignmentStatus: this.courierAssignmentStatus,
          cartProducts: this.cartProducts,
        };
      },
    };

    vi.mocked(Order.find).mockReturnValue(createOrderFindQuery([order]) as never);

    const { GET } = await import('@/app/api/orders/queue/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(applyCourierAssignmentTimeout).toHaveBeenCalledWith(order);
    expect(applyOrderAutoCancellation).toHaveBeenCalledWith(order);
    expect(body.orders).toEqual([
      expect.objectContaining({
        _id: 'order-1',
        courierAssignmentStatus: 'expired',
        isCourierAssignmentExpired: true,
      }),
    ]);
  });
});
