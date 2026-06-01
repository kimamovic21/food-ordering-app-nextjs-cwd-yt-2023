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
    countDocuments: vi.fn(),
    find: vi.fn(),
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
    vi.mocked((await import('@/models/user')).User.countDocuments).mockResolvedValueOnce(
      0 as never
    );

    const { GET } = await loadStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalOrders).toBe(0);
    expect(body.totalUsers).toBe(0);
    expect(Array.isArray(body.monthlyData)).toBe(true);
    expect(Array.isArray(body.dailyData)).toBe(true);
  });

  it('returns order statistics payload for orders endpoint', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(true as never);
    vi.mocked((await import('@/models/order')).Order.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([
        { total: 10, createdAt: new Date(), orderPaid: true },
        { total: 5, createdAt: new Date(), orderPaid: false },
      ]),
    } as never);

    const { GET } = await loadOrdersStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalOrders).toBe(2);
    expect(body.paidOrders).toBe(1);
    expect(body.unpaidOrders).toBe(1);
  });

  it('returns user statistics payload for users endpoint', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(true as never);
    vi.mocked((await import('@/models/user')).User.find).mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([{ createdAt: new Date() }, { createdAt: new Date() }]),
    } as never);

    const { GET } = await loadUsersStats();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalUsers).toBe(2);
    expect(Array.isArray(body.monthlyData)).toBe(true);
  });
});
