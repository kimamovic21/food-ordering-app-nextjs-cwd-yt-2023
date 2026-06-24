import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import {
  notifyCourierAboutAssignment,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { COURIER_OWN_ORDER_ASSIGNMENT_ERROR } from '@/libs/courierAssignment';
import { Order } from '@/models/order';
import { User } from '@/models/user';

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

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifyCourierAboutAssignment: vi.fn(),
  notifyUserAboutOrderStatusChange: vi.fn(),
}));

vi.mock('@/libs/deliveryPin', () => ({
  createDeliveryPin: vi.fn(() => '123456'),
}));

const createObjectId = (value: string) => ({
  toString: () => value,
});

const createAssignRequest = () =>
  new Request('http://localhost/api/my-delivery', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courierId: 'courier-1',
      orderId: 'order-1',
    }),
  });

const createCourier = () => ({
  _id: createObjectId('courier-1'),
  role: 'courier',
  takenOrder: null,
  save: vi.fn(),
});

const createOwnOrder = () => ({
  _id: createObjectId('order-1'),
  userId: createObjectId('courier-1'),
  orderStatus: 'ready',
  save: vi.fn(),
});

describe('courier assignment routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
    vi.mocked(isAdmin).mockResolvedValue(true as never);
  });

  it.each([
    [
      'my-delivery assignment route',
      async () => (await import('@/app/api/my-delivery/route')).PATCH,
    ],
    ['couriers assignment route', async () => (await import('@/app/api/couriers/route')).PATCH],
  ])(
    'blocks a courier from being assigned to their own order through %s',
    async (_label, loadPatch) => {
      const courier = createCourier();
      const order = createOwnOrder();

      vi.mocked(User.findById).mockResolvedValueOnce(courier as never);
      vi.mocked(Order.findById).mockResolvedValueOnce(order as never);

      const PATCH = await loadPatch();
      const response = await PATCH(createAssignRequest());
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: COURIER_OWN_ORDER_ASSIGNMENT_ERROR });
      expect(courier.save).not.toHaveBeenCalled();
      expect(order.save).not.toHaveBeenCalled();
      expect(notifyCourierAboutAssignment).not.toHaveBeenCalled();
      expect(notifyUserAboutOrderStatusChange).not.toHaveBeenCalled();
    }
  );
});
