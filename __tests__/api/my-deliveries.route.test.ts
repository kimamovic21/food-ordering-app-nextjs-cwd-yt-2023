import { getServerSession } from 'next-auth/next';
import { CourierReview } from '@/models/courierReview';
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
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/courierReview', () => ({
  CourierReview: {
    aggregate: vi.fn(),
  },
}));

const createOrderFindQuery = (orders: unknown[]) => {
  const query = {
    sort: vi.fn(() => query),
    lean: vi.fn().mockResolvedValue(orders),
  };

  return query;
};

describe('GET /api/my-deliveries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'courier@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue({
      _id: 'courier-1',
      email: 'courier@example.com',
      role: 'courier',
    } as never);
  });

  it('returns completed deliveries with courier performance summary', async () => {
    vi.mocked(Order.find).mockReturnValue(
      createOrderFindQuery([
        {
          _id: 'order-1',
          courierPickedUpAt: new Date('2026-01-01T10:00:00.000Z'),
          courierDeliveredAt: new Date('2026-01-01T10:20:00.000Z'),
          estimatedDeliveryMinutes: 30,
          deliveryDistanceKm: 4.2,
          deliveryFee: 5,
          completedAt: new Date('2026-01-01T10:25:00.000Z'),
          updatedAt: new Date('2026-01-01T10:25:00.000Z'),
        },
        {
          _id: 'order-2',
          transportationAt: new Date('2026-01-01T11:00:00.000Z'),
          completedAt: new Date('2026-01-01T12:00:00.000Z'),
          estimatedDeliveryMinutes: 30,
          deliveryDistanceKm: 5.8,
          deliveryFee: 7,
          updatedAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      ]) as never
    );
    vi.mocked(Order.countDocuments).mockResolvedValue(2 as never);
    vi.mocked(CourierReview.aggregate).mockResolvedValue([
      { averageRating: 4.5, ratingCount: 4 },
    ] as never);

    const { GET } = await import('@/app/api/my-deliveries/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.orders).toHaveLength(2);
    expect(body.summary).toEqual({
      completedDeliveries: 2,
      declinedAssignments: 2,
      lateDeliveries: 1,
      totalEarnings: 12,
      averageEarning: 6,
      averageDeliveryMinutes: 40,
      totalDistanceKm: 10,
      averageDistanceKm: 5,
      averageRating: 4.5,
      ratingCount: 4,
    });
    expect(body.earningsChart).toEqual([{ month: 'Jan 2026', earnings: 12, deliveries: 2 }]);
    expect(Order.countDocuments).toHaveBeenCalledWith({
      courierDeclinedBy: 'courier-1',
      courierAssignmentStatus: 'declined',
    });
  });
});
