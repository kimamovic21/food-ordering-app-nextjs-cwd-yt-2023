import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { RestaurantReview } from '@/models/restaurantReview';
import { CourierReview } from '@/models/courierReview';
import { notifyUserAboutOrderStatusChange } from '@/libs/notifications';

const stripeRetrieveSession = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        retrieve: stripeRetrieveSession,
      },
    };
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn(() => true),
      },
    },
  },
  Types: {
    ObjectId: {
      isValid: vi.fn(() => true),
    },
  },
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('@/libs/notifications', () => ({
  notifyUserAboutOrderStatusChange: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findOne: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/restaurantReview', () => ({
  RestaurantReview: {
    findOne: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('@/models/courierReview', () => ({
  CourierReview: {
    findOne: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
}));

const admin = {
  _id: { toString: () => 'admin-1' },
  email: 'admin@example.com',
  role: 'admin',
  restaurantId: { toString: () => 'restaurant-1' },
};

const customer = {
  _id: { toString: () => 'user-1' },
  email: 'customer@example.com',
  role: 'user',
  restaurantId: null,
};

const paidOrderDoc = {
  _id: { toString: () => 'order-1' },
  userId: { toString: () => 'user-1' },
  restaurantId: { toString: () => 'restaurant-1' },
  courierId: { toString: () => 'courier-1' },
  orderPaid: true,
  orderStatus: 'processing',
  save: vi.fn(async function save(this: any) {
    return this;
  }),
  toObject() {
    return {
      _id: this._id,
      userId: this.userId,
      restaurantId: this.restaurantId,
      orderPaid: this.orderPaid,
      orderStatus: this.orderStatus,
    };
  },
};

const jsonRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('high-priority order, review, and payment-link routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_payment_link';
    vi.resetModules();
  });

  it('blocks restaurant admins from marking orders completed', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: admin.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(admin),
    } as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', orderStatus: 'completed' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Only courier can mark order as completed' });
    expect(Order.findOne).not.toHaveBeenCalled();
  });

  it('updates paid restaurant orders and emits a status notification', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: admin.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(admin),
    } as never);
    vi.mocked(Order.findOne).mockResolvedValueOnce({ ...paidOrderDoc } as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', orderStatus: 'ready' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('ready');
    expect(Order.findOne).toHaveBeenCalledWith({
      _id: 'order-1',
      restaurantId: admin.restaurantId,
    });
    expect(notifyUserAboutOrderStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: paidOrderDoc.userId,
        orderStatus: 'ready',
      })
    );
  });

  it('allows restaurant review only for a paid completed order owned by the user', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(customer),
    } as never);
    vi.mocked(Order.findById).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        ...paidOrderDoc,
        orderStatus: 'completed',
      }),
    } as never);
    vi.mocked(RestaurantReview.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(null),
    } as never);
    vi.mocked(RestaurantReview.create).mockResolvedValueOnce({
      _id: 'review-1',
      rating: 5,
      reviewText: 'Excellent delivery',
    } as never);

    const { POST } = await import('@/app/api/reviews/route');
    const res = await POST(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'order-1',
          rating: 5,
          reviewText: 'Excellent delivery',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.review._id).toBe('review-1');
    expect(RestaurantReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: paidOrderDoc._id,
        userId: customer._id,
        restaurantId: paidOrderDoc.restaurantId,
      })
    );
  });

  it('blocks courier review before a courier has been assigned', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(customer),
    } as never);
    vi.mocked(Order.findById).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        ...paidOrderDoc,
        courierId: null,
        orderStatus: 'completed',
      }),
    } as never);

    const { POST } = await import('@/app/api/courier-reviews/route');
    const res = await POST(
      new Request('http://localhost/api/courier-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'order-1',
          rating: 4,
          reviewText: 'Fast dropoff',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Courier is not assigned yet for this order' });
    expect(CourierReview.create).not.toHaveBeenCalled();
  });

  it('returns a Stripe payment URL only for an unpaid order owned by the current user', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: customer.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findById).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: 'order-1',
        userId: customer._id,
        restaurantId: { toString: () => 'restaurant-1' },
        orderPaid: false,
        stripeSessionId: 'cs_test_123',
      }),
    } as never);
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'open',
      url: 'https://checkout.stripe.test/session',
    });

    const { GET } = await import('@/app/api/payment-link/route');
    const res = await GET(new Request('http://localhost/api/payment-link?orderId=order-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.test/session' });
    expect(stripeRetrieveSession).toHaveBeenCalledWith('cs_test_123');
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });
});
