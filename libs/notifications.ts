import 'server-only';
import mongoose from 'mongoose';
import { Notification } from '@/models/notification';
import { User } from '@/models/user';

type NotificationType = 'order_paid' | 'order_status_changed' | 'courier_assigned' | 'order_completed';

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
    orderId && mongoose.Types.ObjectId.isValid(orderId.toString())
      ? toObjectId(orderId)
      : null;

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
  completed: 'Delivered',
};

export const formatOrderStatusLabel = (status: string) => humanStatusMap[status] || status;

export const notifyRestaurantAdminsAboutPaidOrder = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  customerEmail: string;
  total: number;
}) => {
  const admins = await User.find({
    role: 'admin',
    restaurantId: params.restaurantId,
  })
    .select('_id')
    .lean();

  if (admins.length === 0) {
    return;
  }

  await createNotifications({
    recipientUserIds: admins.map((admin) => admin._id),
    type: 'order_paid',
    title: 'New paid order received',
    message: `Order #${params.orderId.toString().slice(-6)} was paid by ${params.customerEmail} (total: $${Number(params.total || 0).toFixed(2)}).`,
    orderId: params.orderId,
    metadata: { restaurantId: params.restaurantId.toString() },
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
