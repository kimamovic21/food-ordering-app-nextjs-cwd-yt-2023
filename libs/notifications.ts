import 'server-only';
import mongoose from 'mongoose';
import { Notification } from '@/models/notification';
import { User } from '@/models/user';

type NotificationType =
  | 'order_placed'
  | 'order_paid'
  | 'order_status_changed'
  | 'courier_assigned'
  | 'order_completed'
  | 'order_canceled'
  | 'support_ticket';

type CreateNotificationInput = {
  recipientUserIds: Array<string | mongoose.Types.ObjectId>;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string | mongoose.Types.ObjectId | null;
  metadata?: Record<string, unknown> | null;
};

const toObjectId = (value: string | mongoose.Types.ObjectId) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

export const createNotifications = async ({
  recipientUserIds,
  type,
  title,
  message,
  orderId,
  metadata = null,
}: CreateNotificationInput) => {
  const uniqueRecipientIds = Array.from(
    new Set(
      recipientUserIds
        .filter(Boolean)
        .map((recipientId) => recipientId.toString())
        .filter((recipientId) => mongoose.Types.ObjectId.isValid(recipientId))
    )
  );

  if (uniqueRecipientIds.length === 0) {
    return;
  }

  const orderObjectId =
    orderId && mongoose.Types.ObjectId.isValid(orderId.toString()) ? toObjectId(orderId) : null;

  await Notification.insertMany(
    uniqueRecipientIds.map((recipientId) => ({
      recipientUserId: toObjectId(recipientId),
      type,
      title,
      message,
      orderId: orderObjectId,
      metadata,
      isRead: false,
      readAt: null,
    }))
  );
};

const humanStatusMap: Record<string, string> = {
  placed: 'Placed',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  transportation: 'Out for Delivery',
  delivered: 'Delivered - awaiting confirmation',
  completed: 'Completed',
  canceled: 'Canceled',
};

export const formatOrderStatusLabel = (status: string) => humanStatusMap[status] || status;

const findRestaurantAdminIds = async (restaurantId: string | mongoose.Types.ObjectId) => {
  const admins = await User.find({
    role: 'admin',
    restaurantId,
  })
    .select('_id')
    .lean();

  return admins.map((admin) => admin._id);
};

const findSuperAdminIds = async () => {
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  if (!superAdminEmail) {
    return [];
  }

  const superAdmins = await User.find({
    role: 'admin',
    email: superAdminEmail,
  })
    .select('_id')
    .lean();

  return superAdmins.map((admin) => admin._id);
};

export const notifyOrderPlaced = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  customerUserId: string | mongoose.Types.ObjectId;
  customerEmail: string;
  total: number;
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);
  const orderNumber = params.orderId.toString().slice(-6);
  const total = Number(params.total || 0).toFixed(2);

  await Promise.all([
    createNotifications({
      recipientUserIds: [params.customerUserId],
      type: 'order_placed',
      title: 'Order placed',
      message: `Your order #${orderNumber} has been placed and is waiting for payment confirmation.`,
      orderId: params.orderId,
      metadata: { restaurantId: params.restaurantId.toString() },
    }),
    createNotifications({
      recipientUserIds: adminIds,
      type: 'order_placed',
      title: 'New order placed',
      message: `Order #${orderNumber} was placed by ${params.customerEmail} (total: $${total}).`,
      orderId: params.orderId,
      metadata: { restaurantId: params.restaurantId.toString() },
    }),
  ]);
};

export const notifyRestaurantAdminsAboutPaidOrder = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  customerEmail: string;
  total: number;
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);

  if (adminIds.length === 0) {
    return;
  }

  await createNotifications({
    recipientUserIds: adminIds,
    type: 'order_paid',
    title: 'New paid order received',
    message: `Order #${params.orderId.toString().slice(-6)} was paid by ${params.customerEmail} (total: $${Number(params.total || 0).toFixed(2)}).`,
    orderId: params.orderId,
    metadata: { restaurantId: params.restaurantId.toString() },
  });
};

export const notifyRestaurantAdminsAboutCanceledOrder = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  customerEmail: string;
  total: number;
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);

  if (adminIds.length === 0) {
    return;
  }

  await createNotifications({
    recipientUserIds: adminIds,
    type: 'order_canceled',
    title: 'Order canceled',
    message: `Order #${params.orderId.toString().slice(-6)} was canceled by ${params.customerEmail} (total: $${Number(params.total || 0).toFixed(2)}).`,
    orderId: params.orderId,
    metadata: {
      restaurantId: params.restaurantId.toString(),
      orderStatus: 'canceled',
    },
  });
};

export const notifyUserAboutOrderStatusChange = async (params: {
  userId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  orderStatus: string;
}) => {
  await createNotifications({
    recipientUserIds: [params.userId],
    type: 'order_status_changed',
    title: 'Order status updated',
    message: `Your order #${params.orderId.toString().slice(-6)} is now ${formatOrderStatusLabel(params.orderStatus)}.`,
    orderId: params.orderId,
    metadata: { orderStatus: params.orderStatus },
  });
};

export const notifyCourierAboutAssignment = async (params: {
  courierId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
}) => {
  await createNotifications({
    recipientUserIds: [params.courierId],
    type: 'courier_assigned',
    title: 'New delivery assigned',
    message: `You have been assigned order #${params.orderId.toString().slice(-6)}.`,
    orderId: params.orderId,
  });
};

export const notifyUserAboutOrderCompletion = async (params: {
  userId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
}) => {
  await createNotifications({
    recipientUserIds: [params.userId],
    type: 'order_completed',
    title: 'Order delivered',
    message: `Your order #${params.orderId.toString().slice(-6)} has been marked as delivered.`,
    orderId: params.orderId,
  });
};

export const notifyOrderDelivered = async (params: {
  userId: string | mongoose.Types.ObjectId;
  courierId: string | mongoose.Types.ObjectId;
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);
  const orderNumber = params.orderId.toString().slice(-6);

  await Promise.all([
    createNotifications({
      recipientUserIds: [params.userId],
      type: 'order_completed',
      title: 'Confirm your delivery',
      message: `Courier marked order #${orderNumber} as delivered. Please confirm it when you receive your food.`,
      orderId: params.orderId,
    }),
    createNotifications({
      recipientUserIds: [params.courierId],
      type: 'order_completed',
      title: 'Delivery handoff recorded',
      message: `Order #${orderNumber} is awaiting customer or restaurant confirmation.`,
      orderId: params.orderId,
    }),
    createNotifications({
      recipientUserIds: adminIds,
      type: 'order_completed',
      title: 'Delivery awaiting confirmation',
      message: `Order #${orderNumber} was marked as delivered by the assigned courier.`,
      orderId: params.orderId,
      metadata: { restaurantId: params.restaurantId.toString() },
    }),
  ]);
};

export const notifySupportTicketCreated = async (params: {
  ticketId: string | mongoose.Types.ObjectId;
  orderId?: string | mongoose.Types.ObjectId | null;
  restaurantId?: string | mongoose.Types.ObjectId | null;
  reporterEmail: string;
  target: 'restaurant_support' | 'app_support';
  subject: string;
}) => {
  const recipientIds =
    params.target === 'app_support' || !params.restaurantId
      ? await findSuperAdminIds()
      : await findRestaurantAdminIds(params.restaurantId);

  if (recipientIds.length === 0) {
    return;
  }

  await createNotifications({
    recipientUserIds: recipientIds,
    type: 'support_ticket',
    title: 'New problem report',
    message: `${params.reporterEmail} reported: ${params.subject}`,
    orderId: params.orderId || null,
    metadata: {
      ticketId: params.ticketId.toString(),
      restaurantId: params.restaurantId ? params.restaurantId.toString() : null,
      target: params.target,
    },
  });
};
