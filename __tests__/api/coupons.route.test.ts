import { getServerSession } from 'next-auth/next';
import { mongoConnect } from '@/libs/mongoConnect';
import { Coupon } from '@/models/coupon';
import { Restaurant } from '@/models/restaurant';
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
      ObjectId: class {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
        toString() {
          return this.value;
        }
        static isValid() {
          return true;
        }
      },
    },
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/coupon', () => ({
  Coupon: {
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

const loadCouponsRoute = async () => import('@/app/api/coupons/route');

const adminUser = {
  _id: { toString: () => 'admin-1' },
  email: 'admin@example.com',
  role: 'admin',
  restaurantId: 'restaurant-1',
};

const restaurant = {
  _id: { toString: () => 'restaurant-1' },
  ownerId: adminUser._id,
};

const futureCouponDates = () => {
  const startsAt = new Date(Date.now() - 60_000);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);

  return {
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

const coupon = {
  _id: { toString: () => 'coupon-1' },
  restaurantId: { toString: () => 'restaurant-1' },
  createdBy: { toString: () => 'admin-1' },
  updatedBy: { toString: () => 'admin-1' },
  code: 'SAVE20',
  title: 'Save 20',
  description: 'Twenty percent off',
  discountType: 'percentage',
  discountValue: 20,
  minimumOrderAmount: 10,
  usageLimit: 100,
  usagePerCustomer: 1,
  usageCount: 0,
  startsAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: new Date('2027-01-01T00:00:00Z'),
  isActive: true,
  isPublic: true,
  terms: '',
  tags: ['popular'],
};

const setAdminContext = () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { email: adminUser.email },
  } as never);
  vi.mocked(User.findOne).mockResolvedValue(adminUser as never);
  vi.mocked(Restaurant.findById).mockResolvedValue(restaurant as never);
};

describe('/api/coupons route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates a public coupon by restaurant and subtotal without requiring a session', async () => {
    vi.mocked(Coupon.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(coupon),
    } as never);

    const { GET } = await loadCouponsRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/coupons?code=save20&restaurantId=507f1f77bcf86cd799439011&subtotal=50'
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.coupon.code).toBe('SAVE20');
    expect(body.discountAmount).toBe(10);
    expect(getServerSession).not.toHaveBeenCalled();
    expect(mongoConnect).toHaveBeenCalled();
  });

  it('blocks admin coupon listing without a session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadCouponsRoute();
    const res = await GET(new Request('http://localhost/api/coupons'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('creates a coupon scoped to the current admin restaurant', async () => {
    setAdminContext();
    const dates = futureCouponDates();
    vi.mocked(Coupon.findOne).mockResolvedValueOnce(null as never);
    vi.mocked(Coupon.create).mockResolvedValueOnce(coupon as never);

    const { POST } = await loadCouponsRoute();
    const res = await POST(
      new Request('http://localhost/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: ' save20 ',
          title: 'Save 20',
          description: 'Twenty percent off',
          discountValue: 20,
          minimumOrderAmount: 10,
          usageLimit: 100,
          startsAt: dates.startsAt,
          expiresAt: dates.expiresAt,
          tags: [' popular ', ''],
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.coupon.code).toBe('SAVE20');
    expect(Coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SAVE20',
        restaurantId: restaurant._id,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
        tags: ['popular'],
      })
    );
  });

  it('prevents deleting coupons outside the current admin restaurant', async () => {
    setAdminContext();
    vi.mocked(Coupon.findOneAndDelete).mockResolvedValueOnce(null as never);

    const { DELETE } = await loadCouponsRoute();
    const res = await DELETE(
      new Request('http://localhost/api/coupons?id=507f1f77bcf86cd799439012', {
        method: 'DELETE',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Coupon not found' });
    expect(Coupon.findOneAndDelete).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439012',
      restaurantId: restaurant._id,
    });
  });
});
