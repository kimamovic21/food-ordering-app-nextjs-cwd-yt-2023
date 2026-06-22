import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
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
    countDocuments: vi.fn(),
  },
}));

const loadActiveCountRoute = async () => import('@/app/api/orders/active-count/route');

const adminUser = {
  _id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  restaurantId: 'restaurant-1',
};

const findUser = (user: unknown) => ({
  lean: vi.fn().mockResolvedValue(user),
});

describe('/api/orders/active-count route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 without an authenticated admin session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadActiveCountRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(Order.countDocuments).not.toHaveBeenCalled();
  });

  it('returns 401 for non-admin users', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);
    vi.mocked(User.findOne).mockReturnValueOnce(
      findUser({
        _id: 'user-1',
        email: 'user@example.com',
        role: 'user',
        restaurantId: null,
      }) as never
    );

    const { GET } = await loadActiveCountRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(Order.countDocuments).not.toHaveBeenCalled();
  });

  it('returns 403 when an admin has no assigned restaurant', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: adminUser.email },
    } as never);
    vi.mocked(User.findOne).mockReturnValueOnce(
      findUser({
        ...adminUser,
        restaurantId: null,
      }) as never
    );

    const { GET } = await loadActiveCountRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Admin is not assigned to a restaurant' });
    expect(Order.countDocuments).not.toHaveBeenCalled();
  });

  it('counts only non-completed and non-canceled restaurant orders as active', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: adminUser.email },
    } as never);
    vi.mocked(User.findOne).mockReturnValueOnce(findUser(adminUser) as never);
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(5 as never);

    const { GET } = await loadActiveCountRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ activeOrdersCount: 5 });
    expect(Order.countDocuments).toHaveBeenCalledWith({
      restaurantId: adminUser.restaurantId,
      orderStatus: { $nin: ['completed', 'canceled'] },
    });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });
});
