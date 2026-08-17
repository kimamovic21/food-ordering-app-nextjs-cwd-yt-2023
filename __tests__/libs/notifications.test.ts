import mongoose from 'mongoose';
import {
  createNotifications,
  notifySupportTicketCreated,
  notifyUserAboutOrderCompletion,
  notifyUserAboutOrderStatusChange,
} from '@/libs/notifications';
import { subscribeToNotificationEvents } from '@/libs/notificationEvents';
import { Notification } from '@/models/notification';
import { User } from '@/models/user';

vi.mock('@/models/notification', () => ({
  Notification: {
    insertMany: vi.fn(),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    find: vi.fn(),
  },
}));

const createUserFindQuery = (result: Array<{ _id: string }>) => {
  const query = {
    select: vi.fn(() => query),
    lean: vi.fn().mockResolvedValue(result),
  };

  return query;
};

const mockUserFindResult = (result: Array<{ _id: string }>) => {
  vi.mocked(User.find).mockReturnValueOnce(createUserFindQuery(result) as never);
};

describe('notification helpers', () => {
  const restaurantAdminId = '64a000000000000000000001';
  const superAdminId = '64a000000000000000000002';
  const restaurantId = new mongoose.Types.ObjectId('64a000000000000000000003');
  const ticketId = new mongoose.Types.ObjectId('64a000000000000000000004');
  const orderId = new mongoose.Types.ObjectId('64a000000000000000000005');

  beforeEach(() => {
    process.env.SUPER_ADMIN_EMAIL = 'super@example.com';
    delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  });

  it('notifies restaurant admins and super admins about restaurant support tickets', async () => {
    mockUserFindResult([{ _id: superAdminId }]);
    mockUserFindResult([{ _id: restaurantAdminId }]);

    await notifySupportTicketCreated({
      ticketId,
      orderId,
      restaurantId,
      reporterEmail: 'customer@example.com',
      target: 'restaurant_support',
      subject: 'Missing pizza',
    });

    expect(User.find).toHaveBeenNthCalledWith(1, {
      role: 'admin',
      email: 'super@example.com',
    });
    expect(User.find).toHaveBeenNthCalledWith(2, {
      role: 'admin',
      restaurantId,
    });
    expect(Notification.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: expect.objectContaining({
          toString: expect.any(Function),
        }),
        type: 'support_ticket',
        title: 'New restaurant problem report',
        message: 'customer@example.com reported: Missing pizza',
        orderId,
        isRead: false,
        readAt: null,
      }),
      expect.objectContaining({
        recipientUserId: expect.objectContaining({
          toString: expect.any(Function),
        }),
        type: 'support_ticket',
        title: 'New restaurant problem report',
      }),
    ]);

    const notifications = vi.mocked(Notification.insertMany).mock.calls[0][0];
    expect(notifications.map((notification) => notification.recipientUserId.toString())).toEqual([
      restaurantAdminId,
      superAdminId,
    ]);
    expect(notifications[0].metadata).toEqual({
      ticketId: ticketId.toString(),
      restaurantId: restaurantId.toString(),
      target: 'restaurant_support',
    });
  });

  it('notifies only super admins about app support tickets', async () => {
    mockUserFindResult([{ _id: superAdminId }]);

    await notifySupportTicketCreated({
      ticketId,
      orderId,
      restaurantId,
      reporterEmail: 'customer@example.com',
      target: 'app_support',
      subject: 'Checkout bug',
    });

    expect(User.find).toHaveBeenCalledTimes(1);
    expect(User.find).toHaveBeenCalledWith({
      role: 'admin',
      email: 'super@example.com',
    });
    expect(Notification.insertMany).toHaveBeenCalledTimes(1);

    const notifications = vi.mocked(Notification.insertMany).mock.calls[0][0];
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual(
      expect.objectContaining({
        recipientUserId: expect.objectContaining({
          toString: expect.any(Function),
        }),
        type: 'support_ticket',
        title: 'New app support report',
        message: 'customer@example.com reported: Checkout bug',
        orderId,
        metadata: {
          ticketId: ticketId.toString(),
          restaurantId: restaurantId.toString(),
          target: 'app_support',
        },
        isRead: false,
        readAt: null,
      })
    );
    expect(notifications[0].recipientUserId.toString()).toBe(superAdminId);
  });

  it('uses delivery phase copy with estimated minutes for user status updates', async () => {
    await notifyUserAboutOrderStatusChange({
      userId: restaurantAdminId,
      orderId,
      orderStatus: 'transportation',
      estimatedMinutes: 18,
    });

    expect(Notification.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'order_status_changed',
        title: 'Order status updated',
        message: `Courier picked up order #${orderId.toString().slice(-6)} and is on the way. Estimated time: about 18 minutes.`,
        orderId,
        isRead: false,
        readAt: null,
        metadata: { orderStatus: 'transportation' },
      }),
    ]);
  });

  it('invites the customer to review after an order is completed', async () => {
    await notifyUserAboutOrderCompletion({
      userId: restaurantAdminId,
      orderId,
    });

    expect(Notification.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: expect.objectContaining({
          toString: expect.any(Function),
        }),
        type: 'order_completed',
        title: 'Order completed',
        message: `Your order #${orderId.toString().slice(-6)} is completed. Feel free to rate the restaurant, your order, and the courier when you have a moment.`,
        orderId,
        metadata: { orderStatus: 'completed', reviewPrompt: true },
        isRead: false,
        readAt: null,
      }),
    ]);
  });

  it('emits realtime events when notifications are created', async () => {
    const events: unknown[] = [];
    const unsubscribe = subscribeToNotificationEvents((event) => events.push(event));
    const notificationId = new mongoose.Types.ObjectId('64a000000000000000000006');

    vi.mocked(Notification.insertMany).mockResolvedValueOnce([
      {
        _id: notificationId,
        recipientUserId: new mongoose.Types.ObjectId(restaurantAdminId),
      },
    ] as never);

    await createNotifications({
      recipientUserIds: [restaurantAdminId],
      type: 'order_paid',
      title: 'Paid',
      message: 'Order paid',
      orderId,
      metadata: { restaurantId: restaurantId.toString() },
    });

    unsubscribe();

    expect(events).toEqual([
      expect.objectContaining({
        type: 'notification-created',
        recipientUserId: restaurantAdminId,
        notificationId: notificationId.toString(),
        notificationType: 'order_paid',
        orderId: orderId.toString(),
        title: 'Paid',
        message: 'Order paid',
        metadata: { restaurantId: restaurantId.toString() },
      }),
    ]);
  });
});
