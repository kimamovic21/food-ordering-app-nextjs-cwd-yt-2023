import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { RestaurantReview } from '@/models/restaurantReview';
import { CourierReview } from '@/models/courierReview';
import {
  notifyRestaurantAdminsAboutCanceledOrder,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';

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
  notifyRestaurantAdminsAboutCanceledOrder: vi.fn(),
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

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
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
  email: 'customer@example.com',
  total: 29.99,
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

  it('blocks restaurant admins from marking orders completed before courier delivery', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: admin.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(admin),
    } as never);
    vi.mocked(Order.findOne).mockResolvedValueOnce({ ...paidOrderDoc } as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', orderStatus: 'completed' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Order can be completed only after courier marks it as delivered',
    });
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

  it('blocks restaurant admins from updating canceled orders', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: admin.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(admin),
    } as never);
    vi.mocked(Order.findOne).mockResolvedValueOnce({
      ...paidOrderDoc,
      orderStatus: 'canceled',
    } as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', orderStatus: 'processing' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Canceled orders cannot be updated' });
    expect(notifyUserAboutOrderStatusChange).not.toHaveBeenCalled();
  });

  it('allows customers to cancel their unpaid placed orders and notifies restaurant admins', async () => {
    const unpaidOrderDoc = {
      ...paidOrderDoc,
      orderPaid: false,
      orderStatus: 'placed',
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
          canceledAt: this.canceledAt,
        };
      },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(unpaidOrderDoc as never);

    const { PATCH } = await import('@/app/api/my-orders/route');
    const res = await PATCH(
      new Request('http://localhost/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'cancel-order' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('canceled');
    expect(unpaidOrderDoc.save).toHaveBeenCalled();
    expect(notifyRestaurantAdminsAboutCanceledOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: unpaidOrderDoc.restaurantId,
        orderId: unpaidOrderDoc._id,
        customerEmail: customer.email,
      })
    );
  });

  it('blocks canceling a paid order', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findById).mockResolvedValueOnce({
      ...paidOrderDoc,
      orderStatus: 'placed',
    } as never);

    const { PATCH } = await import('@/app/api/my-orders/route');
    const res = await PATCH(
      new Request('http://localhost/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'cancel-order' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Paid orders cannot be canceled here' });
    expect(notifyRestaurantAdminsAboutCanceledOrder).not.toHaveBeenCalled();
  });

  it('allows customers to confirm their delivered order', async () => {
    const deliveredOrderDoc = {
      ...paidOrderDoc,
      orderStatus: 'delivered',
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
          customerConfirmedDeliveryAt: this.customerConfirmedDeliveryAt,
          deliveryCompletedBy: this.deliveryCompletedBy,
          completedAt: this.completedAt,
        };
      },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(deliveredOrderDoc as never);

    const { PATCH } = await import('@/app/api/my-orders/route');
    const res = await PATCH(
      new Request('http://localhost/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'confirm-delivery' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('completed');
    expect(body.order.deliveryCompletedBy).toBe('customer');
    expect(body.order.customerConfirmedDeliveryAt).toEqual(expect.any(String));
    expect(body.order.completedAt).toEqual(expect.any(String));
    expect(deliveredOrderDoc.save).toHaveBeenCalled();
  });

  it.each(['placed', 'processing', 'ready', 'transportation', 'completed', 'canceled'])(
    'blocks customer confirmation while order is %s',
    async (orderStatus) => {
      const orderDoc = {
        ...paidOrderDoc,
        orderStatus,
        save: vi.fn(),
      };

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { email: customer.email },
      } as never);
      vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
      vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

      const { PATCH } = await import('@/app/api/my-orders/route');
      const res = await PATCH(
        new Request('http://localhost/api/my-orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: 'order-1', action: 'confirm-delivery' }),
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: 'Order can be confirmed only after courier marks it as delivered',
      });
      expect(orderDoc.save).not.toHaveBeenCalled();
    }
  );

  it('blocks customers from confirming another user order', async () => {
    const otherCustomer = {
      ...customer,
      _id: { toString: () => 'user-2' },
    };
    const deliveredOrderDoc = {
      ...paidOrderDoc,
      orderStatus: 'delivered',
      save: vi.fn(),
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: otherCustomer.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(otherCustomer as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(deliveredOrderDoc as never);

    const { PATCH } = await import('@/app/api/my-orders/route');
    const res = await PATCH(
      new Request('http://localhost/api/my-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'confirm-delivery' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Unauthorized - Order does not belong to you' });
    expect(deliveredOrderDoc.save).not.toHaveBeenCalled();
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

  it('blocks payment links for canceled orders', async () => {
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
        orderStatus: 'canceled',
        stripeSessionId: 'cs_test_123',
      }),
    } as never);

    const { GET } = await import('@/app/api/payment-link/route');
    const res = await GET(new Request('http://localhost/api/payment-link?orderId=order-1'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Canceled orders cannot be paid' });
    expect(stripeRetrieveSession).not.toHaveBeenCalled();
  });
});
