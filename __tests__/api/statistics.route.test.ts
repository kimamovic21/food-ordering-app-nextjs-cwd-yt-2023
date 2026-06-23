import { isSuperAdmin } from '@/app/api/auth/[...nextauth]/route';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isSuperAdmin: vi.fn(),
}));

vi.mock('@/models/order', () => ({
  Order: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/supportTicket', () => ({
  SupportTicket: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/notification', () => ({
  Notification: {
    countDocuments: vi.fn(),
  },
}));

const loadStats = async () => await import('@/app/api/statistics/route');
const loadOrdersStats = async () => await import('@/app/api/statistics/orders/route');
const loadUsersStats = async () => await import('@/app/api/statistics/users/route');

describe('/api/statistics routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('blocks non super admin access', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false as never);

    const { GET } = await loadStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  it('returns stable statistics shape for empty orders', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(true as never);
    vi.mocked((await import('@/models/order')).Order.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked((await import('@/models/user')).User.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked((await import('@/models/restaurant')).Restaurant.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as never);
    vi.mocked((await import('@/models/menuItem')).MenuItem.countDocuments).mockResolvedValue(
      0 as never
    );
    vi.mocked(
      (await import('@/models/supportTicket')).SupportTicket.countDocuments
    ).mockResolvedValueOnce(0 as never);
    vi.mocked(
      (await import('@/models/notification')).Notification.countDocuments
    ).mockResolvedValueOnce(0 as never);

    const { GET } = await loadStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalOrders).toBe(0);
    expect(body.totalUsers).toBe(0);
    expect(body.totalRestaurants).toBe(0);
    expect(body.totalMenuItems).toBe(0);
    expect(body.openSupportTickets).toBe(0);
    expect(Array.isArray(body.statusData)).toBe(true);
    expect(Array.isArray(body.topRestaurants)).toBe(true);
    expect(Array.isArray(body.monthlyData)).toBe(true);
    expect(Array.isArray(body.dailyData)).toBe(true);
  });

  it('returns order statistics payload for orders endpoint', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(true as never);
    vi.mocked((await import('@/models/order')).Order.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([
        {
          total: 10,
          createdAt: new Date(),
          orderPaid: true,
          orderStatus: 'completed',
          restaurantId: { toString: () => 'restaurant-1' },
        },
        {
          total: 5,
          createdAt: new Date(),
          orderPaid: false,
          orderStatus: 'canceled',
          restaurantId: { toString: () => 'restaurant-1' },
        },
      ]),
    } as never);
    vi.mocked((await import('@/models/restaurant')).Restaurant.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'restaurant-1' },
            name: 'Test Restaurant',
          },
        ]),
      }),
    } as never);

    const { GET } = await loadOrdersStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalOrders).toBe(2);
    expect(body.paidOrders).toBe(1);
    expect(body.unpaidOrders).toBe(1);
    expect(body.completedOrders).toBe(1);
    expect(body.canceledOrders).toBe(1);
    expect(body.topRestaurants[0].restaurantName).toBe('Test Restaurant');
  });

  it('returns user statistics payload for users endpoint', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(true as never);
    vi.mocked((await import('@/models/user')).User.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([
        { createdAt: new Date(), role: 'user', provider: 'credentials', emailVerifiedAt: null },
        { createdAt: new Date(), role: 'courier', provider: 'google', emailVerifiedAt: new Date() },
      ]),
    } as never);

    const { GET } = await loadUsersStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalUsers).toBe(2);
    expect(body.totalCustomers).toBe(1);
    expect(body.totalCouriers).toBe(1);
    expect(body.googleUsers).toBe(1);
    expect(body.verifiedUsers).toBe(1);
    expect(Array.isArray(body.roleData)).toBe(true);
    expect(Array.isArray(body.monthlyData)).toBe(true);
  });
});
