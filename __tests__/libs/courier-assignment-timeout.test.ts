import { createAuditLog } from '@/libs/auditLog';
import {
  applyCourierAssignmentTimeout,
  COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
} from '@/libs/courierAssignmentTimeout';
import {
  notifyCourierAboutAssignmentExpired,
  notifyRestaurantAdminsAboutCourierAssignmentTimeout,
} from '@/libs/notifications';
import { User } from '@/models/user';

vi.mock('@/libs/auditLog', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('@/libs/notifications', () => ({
  notifyCourierAboutAssignmentExpired: vi.fn(),
  notifyRestaurantAdminsAboutCourierAssignmentTimeout: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findById: vi.fn(),
  },
}));

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

const objectId = (value: string) => ({
  toString: () => value,
});

const createOrderDocument = (overrides: Record<string, unknown> = {}): any => ({
  _id: objectId('order-1'),
  userId: objectId('user-1'),
  restaurantId: objectId('restaurant-1'),
  orderStatus: 'ready',
  courierId: objectId('courier-1'),
  courierAssignmentStatus: 'pending',
  courierAssignedAt: minutesAgo(COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES + 1),
  courierAcceptedAt: null,
  courierAssignmentExpiredAt: null,
  courierAssignmentExpiredCourierId: null,
  courierAssignmentHistory: [],
  restaurantHandedToCourierAt: null,
  courierPickedUpAt: null,
  save: vi.fn(async function save(this: any) {
    return this;
  }),
  ...overrides,
});

describe('courier assignment timeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps pending assignments inside the response window', async () => {
    const order = createOrderDocument({
      courierAssignedAt: minutesAgo(COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES - 1),
    });

    const result = await applyCourierAssignmentTimeout(order as never);

    expect(result.expired).toBe(false);
    expect(order.courierAssignmentStatus).toBe('pending');
    expect(order.courierId.toString()).toBe('courier-1');
    expect(order.save).not.toHaveBeenCalled();
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('expires stale pending assignments and releases the courier', async () => {
    const order = createOrderDocument();
    const courier = {
      name: 'John Doe Courier',
      takenOrder: objectId('order-1'),
      save: vi.fn(async function save(this: any) {
        return this;
      }),
    };
    vi.mocked(User.findById).mockResolvedValueOnce(courier as never);

    const result = await applyCourierAssignmentTimeout(order as never);

    expect(result.expired).toBe(true);
    expect(result.reason).toContain('did not accept or decline');
    expect(order.courierAssignmentStatus).toBe('expired');
    expect(order.courierId).toBeNull();
    expect(order.courierAssignmentExpiredAt).toEqual(expect.any(Date));
    expect(order.courierAssignmentExpiredCourierId.toString()).toBe('courier-1');
    expect(order.courierAssignmentHistory).toEqual([
      expect.objectContaining({
        courierId: order.courierAssignmentExpiredCourierId,
        status: 'expired',
        assignedAt: order.courierAssignedAt,
        respondedAt: order.courierAssignmentExpiredAt,
      }),
    ]);
    expect(courier.takenOrder).toBeNull();
    expect(courier.save).toHaveBeenCalled();
    expect(order.save).toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.courier_assignment_expired',
        metadata: expect.objectContaining({
          courierId: 'courier-1',
          timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
        }),
      })
    );
    expect(notifyRestaurantAdminsAboutCourierAssignmentTimeout).toHaveBeenCalledWith({
      restaurantId: order.restaurantId,
      orderId: order._id,
      courierName: 'John Doe Courier',
      courierId: 'courier-1',
      timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
    });
    expect(notifyCourierAboutAssignmentExpired).toHaveBeenCalledWith({
      courierId: order.courierAssignmentExpiredCourierId,
      orderId: order._id,
      timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
    });
  });

  it('does not release a courier that has already taken another order', async () => {
    const order = createOrderDocument();
    const courier = {
      name: 'John Doe Courier',
      takenOrder: objectId('another-order'),
      save: vi.fn(),
    };
    vi.mocked(User.findById).mockResolvedValueOnce(courier as never);

    await applyCourierAssignmentTimeout(order as never);

    expect(courier.takenOrder.toString()).toBe('another-order');
    expect(courier.save).not.toHaveBeenCalled();
    expect(order.courierId).toBeNull();
  });

  it('ignores accepted assignments and completed orders', async () => {
    const acceptedOrder = createOrderDocument({
      courierAssignmentStatus: 'accepted',
    });
    const completedOrder = createOrderDocument({
      orderStatus: 'completed',
    });

    await expect(applyCourierAssignmentTimeout(acceptedOrder as never)).resolves.toEqual({
      order: acceptedOrder,
      expired: false,
      reason: '',
    });
    await expect(applyCourierAssignmentTimeout(completedOrder as never)).resolves.toEqual({
      order: completedOrder,
      expired: false,
      reason: '',
    });
    expect(User.findById).not.toHaveBeenCalled();
  });
});
