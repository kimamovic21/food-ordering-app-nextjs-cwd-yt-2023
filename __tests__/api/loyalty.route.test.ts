import { getServerSession } from 'next-auth/next';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { calculateLoyaltyStatus } from '@/libs/loyaltyCalculator';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
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

vi.mock('@/libs/loyaltyCalculator', () => ({
  calculateLoyaltyStatus: vi.fn(),
}));

const loadLoyaltyRoute = async () => import('@/app/api/loyalty/route');

const user = {
  _id: 'user-1',
  email: 'loyal@example.com',
};

describe('/api/loyalty route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(calculateLoyaltyStatus).mockReturnValue({
      discountPercentage: 0,
      currentTier: null,
      nextTier: { name: 'Bronze', ordersRequired: 3, discountPercentage: 5 },
      ordersToNextTier: 3,
      totalOrders: 0,
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadLoyaltyRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(Order.countDocuments).not.toHaveBeenCalled();
  });

  it('returns 404 when the session user cannot be found', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: user.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(null as never);

    const { GET } = await loadLoyaltyRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
    expect(Order.countDocuments).not.toHaveBeenCalled();
  });

  it('counts only completed orders toward loyalty and returns frontend-safe shape', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: user.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(7 as never);
    vi.mocked(calculateLoyaltyStatus).mockReturnValueOnce({
      discountPercentage: 10,
      currentTier: { name: 'Gold', ordersRequired: 7, discountPercentage: 10 },
      nextTier: null,
      ordersToNextTier: 0,
      totalOrders: 7,
    } as never);

    const { GET } = await loadLoyaltyRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      discountPercentage: 10,
      currentTier: 'Gold',
      totalOrders: 7,
    });
    expect(Order.countDocuments).toHaveBeenCalledWith({
      userId: user._id,
      orderStatus: 'completed',
    });
    expect(calculateLoyaltyStatus).toHaveBeenCalledWith(7);
  });

  it('returns null current tier when the user has no completed orders', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: user.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(0 as never);

    const { GET } = await loadLoyaltyRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      discountPercentage: 0,
      currentTier: null,
      totalOrders: 0,
    });
  });
});
