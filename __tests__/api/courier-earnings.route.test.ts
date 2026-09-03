import { getServerSession } from 'next-auth/next';
import { mongoConnect } from '@/libs/mongoConnect';
import { CourierReview } from '@/models/courierReview';
import { Order } from '@/models/order';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: vi.fn(() => true),
      },
    },
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    findById: vi.fn(),
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

describe('GET /api/courier-earnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = 'super@example.com';

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'super@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue({
      _id: 'admin-1',
      email: 'super@example.com',
      role: 'admin',
    } as never);
    vi.mocked(User.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'courier-1',
        name: 'Earnings Courier',
        email: 'courier@example.com',
        image: '',
        role: 'courier',
        availability: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as never);
    vi.mocked(Order.find)
      .mockReturnValueOnce(
        createOrderFindQuery([
          {
            _id: 'order-1',
            courierPickedUpAt: new Date('2026-02-01T10:00:00.000Z'),
            completedAt: new Date('2026-02-01T10:20:00.000Z'),
            updatedAt: new Date('2026-02-01T10:20:00.000Z'),
            estimatedDeliveryMinutes: 25,
            deliveryFee: 6,
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
                assignedAt: new Date('2026-02-01T09:56:00.000Z'),
                respondedAt: new Date('2026-02-01T10:00:00.000Z'),
              },
              {
                courierId: 'courier-1',
                status: 'declined',
                assignedAt: new Date('2026-02-02T09:56:00.000Z'),
                respondedAt: new Date('2026-02-02T10:02:00.000Z'),
              },
              {
                courierId: 'courier-1',
                status: 'expired',
                assignedAt: new Date('2026-02-03T09:50:00.000Z'),
                respondedAt: new Date('2026-02-03T10:00:00.000Z'),
              },
            ],
          },
        ]) as never
      );
    vi.mocked(CourierReview.aggregate).mockResolvedValue([
      { averageRating: 5, ratingCount: 2 },
    ] as never);
  });

  it('allows the superadmin to view courier earnings by courier id', async () => {
    const { GET } = await import('@/app/api/courier-earnings/route');
    const response = await GET(
      new Request('http://localhost/api/courier-earnings?courierId=courier-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.courier.email).toBe('courier@example.com');
    expect(body.summary).toEqual({
      completedDeliveries: 1,
      totalAssignments: 3,
      acceptedAssignments: 1,
      respondedAssignments: 2,
      declinedAssignments: 1,
      missedAssignments: 1,
      lateDeliveries: 0,
      totalEarnings: 6,
      averageEarning: 6,
      averageDeliveryMinutes: 20,
      averageResponseMinutes: 5,
      assignmentResponseRate: 67,
      assignmentAcceptanceRate: 50,
      averageRating: 5,
      ratingCount: 2,
    });
    expect(body.earningsChart).toEqual([{ month: 'Feb 2026', earnings: 6, deliveries: 1 }]);
    expect(mongoConnect).toHaveBeenCalled();
  });

  it('blocks regular admins from viewing another courier earnings report', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: 'admin-2',
      email: 'admin@example.com',
      role: 'admin',
    } as never);

    const { GET } = await import('@/app/api/courier-earnings/route');
    const response = await GET(
      new Request('http://localhost/api/courier-earnings?courierId=courier-1')
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Only super admin can view other courier earnings' });
    expect(Order.find).not.toHaveBeenCalled();
  });
});
