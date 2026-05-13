import { getServerSession } from 'next-auth/next';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn(() => true),
      },
    },
  },
}));

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
    findById: vi.fn(),
  },
}));

const loadRoute = async () => await import('@/app/api/orders/courier-location/route');

describe('/api/orders/courier-location route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('blocks unauthenticated access', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/orders/courier-location?orderId=507f1f77bcf86cd799439011'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns courier location for order owner', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'customer@example.com' } } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce({ _id: 'user-1', email: 'customer@example.com', role: 'user' } as never);
    vi.mocked((await import('@/models/order')).Order.findById).mockReturnValueOnce({ populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'order-1', email: 'customer@example.com', courierId: { latitude: 10, longitude: 20, lastLocationUpdate: new Date(), name: 'Courier', email: 'courier@example.com' } }) }) } as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/orders/courier-location?orderId=507f1f77bcf86cd799439011'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.location.latitude).toBe(10);
    expect(body.courier.email).toBe('courier@example.com');
  });
});
