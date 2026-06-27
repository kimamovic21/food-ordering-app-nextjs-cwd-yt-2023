import { getServerSession } from 'next-auth/next';
import { Order } from '@/models/order';
import {
  notifyOrderDelivered,
  notifyRestaurantAdminsAboutCourierAssignmentUpdate,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';

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
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifyOrderDelivered: vi.fn(),
  notifyRestaurantAdminsAboutCourierAssignmentUpdate: vi.fn(),
  notifyUserAboutOrderStatusChange: vi.fn(),
}));

const loadAvailability = async () =>
  (await import('@/app/api/my-delivery/availability/route')).PATCH;
const loadLocation = async () => (await import('@/app/api/my-delivery/location/route')).POST;
const loadGetLocation = async () => (await import('@/app/api/my-delivery/location/route')).GET;
const loadDeliveryOrdersPatch = async () =>
  (await import('@/app/api/my-delivery/orders/route')).PATCH;

const courierUser = () => ({
  _id: { toString: () => 'courier-1' },
  email: 'c@courier.com',
  role: 'courier',
  takenOrder: 'order-1',
  save: vi.fn(async function save(this: any) {
    return this;
  }),
});

const assignedOrder = (overrides: Record<string, unknown> = {}) => ({
  _id: 'order-1',
  userId: 'user-1',
  restaurantId: 'restaurant-1',
  courierId: { toString: () => 'courier-1' },
  orderStatus: 'transportation',
  orderPaid: true,
  deliveryPin: '123456',
  save: vi.fn(async function save(this: any) {
    return this;
  }),
  toObject() {
    return {
      _id: this._id,
      userId: this.userId,
      restaurantId: this.restaurantId,
      courierId: this.courierId,
      orderStatus: this.orderStatus,
      orderPaid: this.orderPaid,
      deliveryPin: this.deliveryPin,
      courierDeliveredAt: this.courierDeliveredAt,
      courierAssignmentStatus: this.courierAssignmentStatus,
      courierAcceptedAt: this.courierAcceptedAt,
      courierDeclinedBy: this.courierDeclinedBy,
      courierDeclinedAt: this.courierDeclinedAt,
      restaurantHandedToCourierAt: this.restaurantHandedToCourierAt,
      courierPickedUpAt: this.courierPickedUpAt,
      transportationAt: this.transportationAt,
    };
  },
  ...overrides,
});

describe('Courier availability and location routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when availability toggled without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);
    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-courier toggles availability', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'a@b.com', role: 'user' },
    } as never);
    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Only couriers can toggle availability' });
  });

  it('toggles availability when courier calls endpoint', async () => {
    const userDoc: any = {
      email: 'c@courier.com',
      availability: false,
      save: vi.fn(async () => {}),
    };
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'c@courier.com', role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);

    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('availability', true);
    expect(userDoc.save).toHaveBeenCalled();
  });

  it('rejects invalid location inputs for courier', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'c@courier.com', role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce({
      email: 'c@courier.com',
      role: 'courier',
      latitude: null,
      longitude: null,
    } as never);

    const POST = await loadLocation();
    const res = await POST(
      new Request('http://localhost/api/my-delivery/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: 'bad', longitude: 10 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('updates location for courier with valid coordinates', async () => {
    const courier = {
      _id: 'cid1',
      email: 'c@courier.com',
      role: 'courier',
      latitude: null,
      longitude: null,
    };
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: courier.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(courier as never);
    vi.mocked((await import('@/models/user')).User.findByIdAndUpdate).mockResolvedValueOnce({
      latitude: 45,
      longitude: 15,
      lastLocationUpdate: new Date(),
    } as never);

    const POST = await loadLocation();
    const res = await POST(
      new Request('http://localhost/api/my-delivery/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: 45, longitude: 15 }),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.location.latitude).toBe(45);
  });

  it('returns 403 for GET location when not courier', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'u@x.com', role: 'user' },
    } as never);
    const GET = await loadGetLocation();
    const res = await GET(
      new Request('http://localhost/api/my-delivery/location', { method: 'GET' })
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Only courier can fetch their location' });
  });

  it.each([
    ['missing', undefined],
    ['wrong', '999999'],
  ])('rejects %s delivery PIN when marking an order delivered', async (_label, deliveryPin) => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder();

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', deliveryPin }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid delivery PIN' });
    expect(orderDoc.save).not.toHaveBeenCalled();
    expect(userDoc.save).not.toHaveBeenCalled();
    expect(notifyOrderDelivered).not.toHaveBeenCalled();
  });

  it('blocks couriers from marking another courier order delivered', async () => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder({
      courierId: { toString: () => 'other-courier' },
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', deliveryPin: '123456' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'You are not assigned to this order' });
    expect(orderDoc.save).not.toHaveBeenCalled();
    expect(userDoc.save).not.toHaveBeenCalled();
  });

  it('lets assigned couriers accept pending assignments', async () => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder({
      orderStatus: 'ready',
      courierAssignmentStatus: 'pending',
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'accept-assignment' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.courierAssignmentStatus).toBe('accepted');
    expect(orderDoc.courierAcceptedAt).toEqual(expect.any(Date));
    expect(orderDoc.save).toHaveBeenCalled();
    expect(notifyRestaurantAdminsAboutCourierAssignmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: orderDoc.restaurantId,
        orderId: orderDoc._id,
        status: 'accepted',
      })
    );
  });

  it('lets assigned couriers decline assignments and frees the courier', async () => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder({
      orderStatus: 'ready',
      courierAssignmentStatus: 'pending',
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'decline-assignment' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.courierAssignmentStatus).toBe('declined');
    expect(orderDoc.courierDeclinedBy).toBe(userDoc._id);
    expect(orderDoc.courierId).toBeNull();
    expect(userDoc.takenOrder).toBeNull();
    expect(orderDoc.save).toHaveBeenCalled();
    expect(userDoc.save).toHaveBeenCalled();
  });

  it('lets couriers mark accepted and handed orders as picked up', async () => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder({
      orderStatus: 'ready',
      courierAssignmentStatus: 'accepted',
      restaurantHandedToCourierAt: new Date(),
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', action: 'pick-up' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('transportation');
    expect(orderDoc.orderStatus).toBe('transportation');
    expect(orderDoc.courierPickedUpAt).toEqual(expect.any(Date));
    expect(orderDoc.transportationAt).toEqual(expect.any(Date));
    expect(orderDoc.save).toHaveBeenCalled();
    expect(notifyUserAboutOrderStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: orderDoc.userId,
        orderId: orderDoc._id,
        orderStatus: 'transportation',
      })
    );
  });

  it('marks assigned orders delivered with the correct PIN without exposing the PIN', async () => {
    const userDoc = courierUser();
    const orderDoc = assignedOrder();

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: userDoc.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);
    vi.mocked(Order.findById).mockResolvedValueOnce(orderDoc as never);

    const PATCH = await loadDeliveryOrdersPatch();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1', deliveryPin: '123456' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.orderStatus).toBe('delivered');
    expect(body.order.deliveryPin).toBeUndefined();
    expect(orderDoc.orderStatus).toBe('delivered');
    expect(orderDoc.courierDeliveredAt).toEqual(expect.any(Date));
    expect(userDoc.takenOrder).toBeNull();
    expect(orderDoc.save).toHaveBeenCalled();
    expect(userDoc.save).toHaveBeenCalled();
    expect(notifyOrderDelivered).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: orderDoc.userId,
        courierId: userDoc._id,
        restaurantId: orderDoc.restaurantId,
        orderId: orderDoc._id,
      })
    );
  });
});
