import { getServerSession } from 'next-auth/next';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { Order } from '@/models/order';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('@/libs/orderAutoCancellation', () => ({
  applyOrderAutoCancellation: vi.fn(),
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

const loadRoute = async () => import('@/app/api/my-orders/active/route');

const mockOrderFind = (orders: any[]) => {
  const limit = vi.fn().mockResolvedValue(orders);
  const sort = vi.fn().mockReturnValue({ limit });
  vi.mocked(Order.find).mockReturnValue({ sort } as never);
  return { sort, limit };
};

const createOrder = (overrides: Record<string, unknown> = {}) => {
  const order = {
    _id: { toString: () => 'order-1' },
    orderStatus: 'processing',
    orderPaid: true,
    paid: true,
    createdAt: new Date('2026-09-07T10:00:00.000Z'),
    updatedAt: new Date('2026-09-07T10:05:00.000Z'),
    estimatedTotalMinutes: 45,
    ...overrides,
  };

  return {
    ...order,
    toObject: () => order,
  };
};

describe('/api/my-orders/active route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'customer@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue({
      _id: { toString: () => 'user-1' },
    } as never);
  });

  it('requires authentication', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns the latest active order for the current user', async () => {
    const order = createOrder();
    mockOrderFind([order]);
    vi.mocked(applyOrderAutoCancellation).mockResolvedValue({ order } as never);

    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order).toEqual(
      expect.objectContaining({
        _id: 'order-1',
        orderStatus: 'processing',
        paymentStatus: true,
        estimatedTotalMinutes: 45,
      })
    );
    expect(Order.find).toHaveBeenCalledWith({
      userId: expect.anything(),
      orderStatus: { $nin: ['completed', 'canceled'] },
    });
  });

  it('returns null when candidate orders are auto-canceled', async () => {
    const order = createOrder({ orderStatus: 'canceled', orderPaid: false, paid: false });
    mockOrderFind([order]);
    vi.mocked(applyOrderAutoCancellation).mockResolvedValue({ order } as never);

    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order).toBeNull();
  });
});
