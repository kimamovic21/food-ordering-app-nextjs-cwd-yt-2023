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
    select: vi.fn(() => query),
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
    vi.mocked(Order.find)
      .mockReturnValueOnce(
        createOrderFindQuery([
          {
            _id: 'order-1',
            courierPickedUpAt: new Date('2026-01-01T10:00:00.000Z'),
            courierDeliveredAt: new Date('2026-01-01T10:20:00.000Z'),
            estimatedDeliveryMinutes: 30,
            deliveryFee: 5,
            completedAt: new Date('2026-01-01T10:25:00.000Z'),
            updatedAt: new Date('2026-01-01T10:25:00.000Z'),
          },
          {
            _id: 'order-2',
            transportationAt: new Date('2026-01-01T11:00:00.000Z'),
            completedAt: new Date('2026-01-01T12:00:00.000Z'),
            estimatedDeliveryMinutes: 30,
            deliveryFee: 7,
            updatedAt: new Date('2026-01-01T12:00:00.000Z'),
          },
        ]) as never
      )
      .mockReturnValueOnce(
        createOrderFindQuery([
          {
            _id: 'order-1',
            courierAssignmentHistory: [
              {
                courierId: 'courier-1',
                status: 'accepted',
                assignedAt: new Date('2026-01-01T09:58:00.000Z'),
                respondedAt: new Date('2026-01-01T10:00:00.000Z'),
              },
              {
                courierId: 'courier-1',
                status: 'declined',
                assignedAt: new Date('2026-01-02T09:58:00.000Z'),
                respondedAt: new Date('2026-01-02T10:02:00.000Z'),
              },
              {
                courierId: 'courier-1',
                status: 'expired',
                assignedAt: new Date('2026-01-03T09:50:00.000Z'),
                respondedAt: new Date('2026-01-03T10:00:00.000Z'),
              },
            ],
          },
        ]) as never
      );
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
      totalAssignments: 3,
      acceptedAssignments: 1,
      respondedAssignments: 2,
      declinedAssignments: 1,
      missedAssignments: 1,
      lateDeliveries: 1,
      totalEarnings: 12,
      averageEarning: 6,
      averageDeliveryMinutes: 40,
      averageResponseMinutes: 3,
      assignmentResponseRate: 67,
      assignmentAcceptanceRate: 50,
      averageRating: 4.5,
      ratingCount: 4,
    });
    expect(body.earningsChart).toEqual([{ month: 'Jan 2026', earnings: 12, deliveries: 2 }]);
    expect(Order.find).toHaveBeenCalledWith({
      $or: [
        { 'courierAssignmentHistory.courierId': 'courier-1' },
        { courierId: 'courier-1', courierAssignmentStatus: 'accepted' },
        { courierDeclinedBy: 'courier-1', courierAssignmentStatus: 'declined' },
        { courierAssignmentExpiredCourierId: 'courier-1' },
      ],
    });
  });
});
