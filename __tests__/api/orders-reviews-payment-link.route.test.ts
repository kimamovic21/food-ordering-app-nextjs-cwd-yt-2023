import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import { Restaurant } from '@/models/restaurant';
import { RestaurantReview } from '@/models/restaurantReview';
import { CourierReview } from '@/models/courierReview';
import {
  notifyFailedDeliveryCancellationVerified,
  notifyRestaurantAdminsAboutCanceledOrder,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';

const stripeRetrieveSession = vi.fn();
const stripeCreateSession = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        retrieve: stripeRetrieveSession,
        create: stripeCreateSession,
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
  notifyFailedDeliveryCancellationVerified: vi.fn(),
  notifyCourierAboutRestaurantHandoff: vi.fn(),
  notifyRestaurantAdminsAboutCanceledOrder: vi.fn(),
  notifyUserAboutOrderStatusChange: vi.fn(),
}));

vi.mock('@/libs/auditLog', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('@/libs/restaurantAvailabilityRequests', () => ({
  notifyWaitingUsersIfRestaurantAcceptingOrders: vi.fn(),
  notifyWaitingUsersIfRestaurantCanAcceptOrders: vi.fn(),
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

const superAdmin = {
  _id: { toString: () => 'super-admin-1' },
  email: 'super@example.com',
  role: 'admin',
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

const createOrderFindQuery = (orders: unknown[]) => {
  const query = {
    sort: vi.fn(() => query),
    limit: vi.fn(() => query),
    lean: vi.fn().mockResolvedValue(orders),
  };

  return query;
};

describe('high-priority order, review, and payment-link routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_payment_link';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.SUPER_ADMIN_EMAIL;
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

  it('lets restaurant admins verify failed delivery cancellation and release courier', async () => {
    const courierDoc = {
      _id: { toString: () => 'courier-1' },
      takenOrder: { toString: () => 'order-1' },
      save: vi.fn(async function save(this: any) {
        return this;
      }),
    };
    const failedDeliveryOrderDoc = {
      ...paidOrderDoc,
      orderStatus: 'transportation',
      failedDeliveryRequestedAt: new Date('2026-07-10T10:00:00.000Z'),
      save: vi.fn(async function save(this: any) {
        return this;
      }),
      toObject() {
        return {
          _id: this._id,
          userId: this.userId,
          restaurantId: this.restaurantId,
          courierId: this.courierId,
          orderPaid: this.orderPaid,
          paid: this.paid,
          orderStatus: this.orderStatus,
          failedDeliveryVerifiedAt: this.failedDeliveryVerifiedAt,
          failedDeliveryVerifiedBy: this.failedDeliveryVerifiedBy,
          failedDeliveryVerifiedByRole: this.failedDeliveryVerifiedByRole,
          canceledBy: this.canceledBy,
          canceledAt: this.canceledAt,
        };
      },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: admin.email } } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(admin),
    } as never);
    vi.mocked(Order.findOne).mockResolvedValueOnce(failedDeliveryOrderDoc as never);
    vi.mocked(User.findById).mockResolvedValueOnce(courierDoc as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', action: 'verify-failed-delivery' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('canceled');
    expect(body.order.canceledBy).toBe('restaurant_owner');
    expect(failedDeliveryOrderDoc.orderPaid).toBe(false);
    expect(failedDeliveryOrderDoc.paid).toBe(false);
    expect(courierDoc.takenOrder).toBeNull();
    expect(courierDoc.save).toHaveBeenCalled();
    expect(failedDeliveryOrderDoc.save).toHaveBeenCalled();
    expect(notifyFailedDeliveryCancellationVerified).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: failedDeliveryOrderDoc.userId,
        courierId: failedDeliveryOrderDoc.courierId,
        restaurantId: failedDeliveryOrderDoc.restaurantId,
        verifiedBy: 'restaurant_owner',
      })
    );
  });

  it('lets super admin verify failed delivery cancellation without restaurant ownership', async () => {
    process.env.SUPER_ADMIN_EMAIL = superAdmin.email;
    const failedDeliveryOrderDoc = {
      ...paidOrderDoc,
      orderStatus: 'transportation',
      failedDeliveryRequestedAt: new Date('2026-07-10T10:00:00.000Z'),
      save: vi.fn(async function save(this: any) {
        return this;
      }),
      toObject() {
        return {
          _id: this._id,
          orderPaid: this.orderPaid,
          orderStatus: this.orderStatus,
          failedDeliveryVerifiedByRole: this.failedDeliveryVerifiedByRole,
          canceledBy: this.canceledBy,
        };
      },
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: superAdmin.email },
    } as never);
    vi.mocked(User.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(superAdmin),
    } as never);
    vi.mocked(Order.findOne).mockResolvedValueOnce(failedDeliveryOrderDoc as never);
    vi.mocked(User.findById).mockResolvedValueOnce(null as never);

    const { PATCH } = await import('@/app/api/orders/route');
    const res = await PATCH(jsonRequest({ id: 'order-1', action: 'verify-failed-delivery' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.canceledBy).toBe('super_admin');
    expect(Order.findOne).toHaveBeenCalledWith({ _id: 'order-1' });
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

  it('builds reorder cart items from current menu item data', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => 'order-1' },
        userId: customer._id,
        restaurantId: { toString: () => 'restaurant-1' },
        cartProducts: [
          {
            productId: { toString: () => 'menu-item-1' },
            name: 'Old Pizza',
            size: 'medium',
            quantity: 2,
            price: 9,
          },
        ],
      }),
    } as never);
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            description: 'Fresh pizza',
            image: 'pizza.jpg',
            priceType: 'triple',
            priceMedium: 12,
            restaurantId: { toString: () => 'restaurant-1' },
            isAvailable: true,
          },
        ]),
      }),
    } as never);

    const { POST } = await import('@/app/api/my-orders/reorder/route');
    const res = await POST(
      new Request('http://localhost/api/my-orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cartItems).toEqual([
      expect.objectContaining({
        _id: 'menu-item-1',
        name: 'Pizza',
        size: 'medium',
        quantity: 2,
        price: 12,
        restaurantId: 'restaurant-1',
      }),
    ]);
  });

  it('builds the customer usual order from the most repeated completed order pattern', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.find).mockReturnValueOnce(
      createOrderFindQuery([
        {
          _id: { toString: () => 'order-2' },
          userId: customer._id,
          restaurantId: { toString: () => 'restaurant-1' },
          completedAt: new Date('2026-07-01T10:00:00.000Z'),
          cartProducts: [
            {
              productId: { toString: () => 'menu-item-1' },
              restaurantId: { toString: () => 'restaurant-1' },
              name: 'Old Pizza',
              size: 'medium',
              quantity: 2,
              price: 9,
            },
          ],
        },
        {
          _id: { toString: () => 'order-1' },
          userId: customer._id,
          restaurantId: { toString: () => 'restaurant-1' },
          completedAt: new Date('2026-06-25T10:00:00.000Z'),
          cartProducts: [
            {
              productId: { toString: () => 'menu-item-1' },
              restaurantId: { toString: () => 'restaurant-1' },
              name: 'Old Pizza',
              size: 'medium',
              quantity: 2,
              price: 9,
            },
          ],
        },
      ]) as never
    );
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            description: 'Fresh pizza',
            image: 'pizza.jpg',
            priceType: 'triple',
            priceMedium: 12,
            restaurantId: { toString: () => 'restaurant-1' },
            isAvailable: true,
          },
        ]),
      }),
    } as never);

    const { GET } = await import('@/app/api/my-orders/usual/route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.usualOrder.repeatCount).toBe(2);
    expect(body.usualOrder.subtotal).toBe(24);
    expect(body.usualOrder.cartItems).toEqual([
      expect.objectContaining({
        _id: 'menu-item-1',
        name: 'Pizza',
        size: 'medium',
        quantity: 2,
        price: 12,
      }),
    ]);
  });

  it('blocks reordering currently unavailable menu items', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => 'order-1' },
        userId: customer._id,
        restaurantId: { toString: () => 'restaurant-1' },
        cartProducts: [
          {
            productId: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            size: 'small',
            quantity: 1,
            price: 9,
          },
        ],
      }),
    } as never);
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            restaurantId: { toString: () => 'restaurant-1' },
            isAvailable: false,
          },
        ]),
      }),
    } as never);

    const { POST } = await import('@/app/api/my-orders/reorder/route');
    const res = await POST(
      new Request('http://localhost/api/my-orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Pizza is currently unavailable.' });
  });

  it('builds quick reorder cart items from the latest restaurant order', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: customer.email } } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Restaurant.findById).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: { toString: () => 'restaurant-1' },
          name: 'Pizza Hub',
        }),
      }),
    } as never);
    vi.mocked(Order.findOne).mockReturnValueOnce({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: { toString: () => 'order-2' },
          userId: customer._id,
          restaurantId: { toString: () => 'restaurant-1' },
          cartProducts: [
            {
              productId: { toString: () => 'menu-item-1' },
              restaurantId: { toString: () => 'restaurant-1' },
              name: 'Old Burger',
              size: 'single',
              quantity: 1,
              price: 8,
            },
          ],
        }),
      }),
    } as never);
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Classic Burger',
            description: 'Fresh burger',
            image: 'burger.jpg',
            priceType: 'single',
            priceSmall: 9.5,
            restaurantId: { toString: () => 'restaurant-1' },
            isAvailable: true,
          },
        ]),
      }),
    } as never);

    const { POST } = await import('@/app/api/restaurants/[id]/quick-reorder/route');
    const res = await POST(
      new Request('http://localhost/api/restaurants/restaurant-1/quick-reorder'),
      {
        params: Promise.resolve({ id: 'restaurant-1' }),
      }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.restaurantName).toBe('Pizza Hub');
    expect(body.cartItems).toEqual([
      expect.objectContaining({
        _id: 'menu-item-1',
        name: 'Classic Burger',
        size: 'single',
        quantity: 1,
        price: 9.5,
        restaurantId: 'restaurant-1',
      }),
    ]);
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
    const orderDocument = {
      _id: { toString: () => 'order-1' },
      userId: customer._id,
      restaurantId: { toString: () => 'restaurant-1' },
      email: customer.email,
      total: 25,
      orderPaid: false,
      stripeSessionId: 'cs_test_123',
      save: vi.fn(),
    };
    vi.mocked(Order.findById).mockReturnValueOnce({
      then: (resolve: (value: unknown) => unknown) => resolve(orderDocument),
    } as never);
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'open',
      payment_status: 'unpaid',
      url: 'https://checkout.stripe.test/session',
    });

    const { GET } = await import('@/app/api/payment-link/route');
    const res = await GET(new Request('http://localhost/api/payment-link?orderId=order-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.test/session' });
    expect(stripeRetrieveSession).toHaveBeenCalledWith('cs_test_123');
    expect(stripeCreateSession).not.toHaveBeenCalled();
    expect(orderDocument.save).not.toHaveBeenCalled();
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });

  it('syncs an order as paid when Stripe says the existing session is already paid', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: customer.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    const orderDocument = {
      _id: { toString: () => 'order-1' },
      userId: customer._id,
      restaurantId: { toString: () => 'restaurant-1' },
      email: customer.email,
      total: 25,
      orderPaid: false,
      paid: false,
      stripeSessionId: 'cs_test_paid_123',
      save: vi.fn(),
    };
    vi.mocked(Order.findById).mockReturnValueOnce({
      then: (resolve: (value: unknown) => unknown) => resolve(orderDocument),
    } as never);
    stripeRetrieveSession.mockResolvedValueOnce({
      id: 'cs_test_paid_123',
      status: 'complete',
      payment_status: 'paid',
      url: null,
    });

    const { GET } = await import('@/app/api/payment-link/route');
    const res = await GET(new Request('http://localhost/api/payment-link?orderId=order-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      paid: true,
      message: 'Payment was already completed. Your order has been updated.',
    });
    expect(orderDocument.orderPaid).toBe(true);
    expect(orderDocument.paid).toBe(true);
    expect(orderDocument.save).toHaveBeenCalledTimes(1);
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('creates a new Stripe session when the old payment session cannot be reused', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: customer.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    const orderDocument = {
      _id: { toString: () => 'order-1' },
      userId: customer._id,
      restaurantId: { toString: () => 'restaurant-1' },
      email: customer.email,
      total: 29.03,
      orderPaid: false,
      stripeSessionId: 'cs_test_expired_123',
      save: vi.fn(),
    };
    vi.mocked(Order.findById).mockReturnValueOnce({
      then: (resolve: (value: unknown) => unknown) => resolve(orderDocument),
    } as never);
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'expired',
      payment_status: 'unpaid',
      url: null,
    });
    stripeCreateSession.mockResolvedValueOnce({
      id: 'cs_test_new_123',
      url: 'https://checkout.stripe.test/new-session',
    });

    const { GET } = await import('@/app/api/payment-link/route');
    const res = await GET(new Request('http://localhost/api/payment-link?orderId=order-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.test/new-session' });
    expect(stripeCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: customer.email,
        metadata: { orderId: 'order-1' },
      })
    );
    expect(orderDocument.stripeSessionId).toBe('cs_test_new_123');
    expect(orderDocument.save).toHaveBeenCalledTimes(1);
  });

  it('blocks payment links for canceled orders', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: customer.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce(customer as never);
    vi.mocked(Order.findById).mockReturnValueOnce({
      then: (resolve: (value: unknown) => unknown) =>
        resolve({
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
