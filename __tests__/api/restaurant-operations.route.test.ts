import { getServerSession } from 'next-auth/next';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { mongoConnect } from '@/libs/mongoConnect';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('@/libs/courierAssignmentTimeout', () => ({
  applyCourierAssignmentTimeout: vi.fn(async (order) => ({ order, expired: false, reason: '' })),
}));

vi.mock('@/libs/orderAutoCancellation', () => ({
  applyOrderAutoCancellation: vi.fn(async (order) => ({ order, canceled: false, reason: '' })),
}));

vi.mock('@/libs/courierSchedule', () => ({
  isCourierScheduledNow: vi.fn(() => true),
}));

vi.mock('@/libs/restaurantAvailability', () => ({
  getRestaurantOrderingStatus: vi.fn(() => ({
    isOpen: true,
    isPaused: false,
    isAcceptingOrders: true,
    isClosingSoonForCheckout: false,
    reason: null,
  })),
}));

vi.mock('@/libs/restaurantOperationsDateRange', () => ({
  getRestaurantOperationsDateRange: vi.fn(() => ({
    start: new Date('2026-09-08T00:00:00.000Z'),
    end: new Date('2026-09-08T23:59:59.999Z'),
    label: '08/09/2026',
  })),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    find: vi.fn(),
  },
}));

const createLeanQuery = (result: unknown) => ({
  lean: vi.fn().mockResolvedValue(result),
});

const createSelectLeanQuery = (result: unknown) => ({
  select: vi.fn(() => createLeanQuery(result)),
});

const createSortQuery = (result: unknown) => ({
  sort: vi.fn().mockResolvedValue(result),
});

const createOrderDocument = (order: Record<string, unknown>) => ({
  ...order,
  toObject: () => order,
});

describe('GET /api/restaurant/operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockReturnValue(
      createLeanQuery({
        _id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        restaurantId: 'restaurant-1',
      }) as never
    );
    vi.mocked(Restaurant.findOne).mockReturnValue(
      createLeanQuery({
        _id: 'restaurant-1',
        ownerId: 'admin-1',
        name: 'Pizza Hub',
        activeOrderLimit: 4,
        isPaused: false,
      }) as never
    );
    vi.mocked(User.find).mockReturnValue(
      createSelectLeanQuery([
        { _id: 'courier-1', availability: true, takenOrder: null, courierWorkingHours: [] },
        { _id: 'courier-2', availability: false, takenOrder: null, courierWorkingHours: [] },
      ]) as never
    );
  });

  it('returns restaurant operations overview for the assigned admin restaurant', async () => {
    const activeOrder = createOrderDocument({
      _id: 'order-active',
      email: 'customer@example.com',
      orderStatus: 'processing',
      orderPaid: true,
      paid: true,
      total: 24,
      createdAt: new Date('2026-09-08T10:00:00.000Z'),
    });

    vi.mocked(Order.find)
      .mockReturnValueOnce(createSortQuery([activeOrder]) as never)
      .mockReturnValueOnce(
        createLeanQuery([
          {
            _id: 'order-today',
            email: 'paid@example.com',
            orderStatus: 'completed',
            orderPaid: true,
            total: 30,
          },
          {
            _id: 'order-unpaid',
            email: 'unpaid@example.com',
            orderStatus: 'placed',
            orderPaid: false,
            total: 16,
          },
        ]) as never
      );

    const { GET } = await import('@/app/api/restaurant/operations/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mongoConnect).toHaveBeenCalled();
    expect(applyCourierAssignmentTimeout).toHaveBeenCalledWith(activeOrder);
    expect(applyOrderAutoCancellation).toHaveBeenCalledWith(activeOrder);
    expect(body.operations.restaurant.name).toBe('Pizza Hub');
    expect(body.operations.restaurant.activeKitchenOrders).toBe(1);
    expect(body.operations.today).toEqual(
      expect.objectContaining({
        label: '08/09/2026',
        totalOrders: 2,
        paidOrders: 1,
        unpaidOrders: 1,
        revenue: 30,
      })
    );
    expect(body.operations.couriers.availableCouriers).toBe(1);
    expect(body.operations.stageCounts).toContainEqual(
      expect.objectContaining({ status: 'processing', count: 1 })
    );
  });

  it('rejects admins without a connected restaurant', async () => {
    vi.mocked(Restaurant.findOne)
      .mockReturnValueOnce(createLeanQuery(null) as never)
      .mockReturnValueOnce(createLeanQuery(null) as never);

    const { GET } = await import('@/app/api/restaurant/operations/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Admin is not assigned to a restaurant' });
  });
});
