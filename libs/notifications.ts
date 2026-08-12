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
  | 'support_ticket'
  | 'late_order';

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
  estimatedMinutes?: number | null;
}) => {
  const orderNumber = params.orderId.toString().slice(-6);
  const estimate =
    typeof params.estimatedMinutes === 'number' && params.estimatedMinutes > 0
      ? ` Estimated time: about ${params.estimatedMinutes} minutes.`
      : '';
  const statusMessages: Record<string, string> = {
    processing: `Kitchen started preparing order #${orderNumber}.${estimate}`,
    ready: `Order #${orderNumber} is ready and waiting for courier handoff.`,
    transportation: `Courier picked up order #${orderNumber} and is on the way.${estimate}`,
    delivered: `Courier marked order #${orderNumber} as delivered. Please confirm it when you receive your food.`,
    completed: `Order #${orderNumber} is completed. Thank you for confirming delivery.`,
    canceled: `Order #${orderNumber} was canceled.`,
  };

  await createNotifications({
    recipientUserIds: [params.userId],
    type: 'order_status_changed',
    title: 'Order status updated',
    message:
      statusMessages[params.orderStatus] ||
      `Your order #${orderNumber} is now ${formatOrderStatusLabel(params.orderStatus)}.`,
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

export const notifyCourierAboutRestaurantHandoff = async (params: {
  courierId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
}) => {
  await createNotifications({
    recipientUserIds: [params.courierId],
    type: 'courier_assigned',
    title: 'Order handed to you',
    message: `Restaurant marked order #${params.orderId.toString().slice(-6)} as handed to courier. Please record pickup when you receive it.`,
    orderId: params.orderId,
  });
};

export const notifyRestaurantAdminsAboutCourierAssignmentUpdate = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  courierName?: string | null;
  status: 'accepted' | 'declined' | 'picked_up';
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);

  if (adminIds.length === 0) {
    return;
  }

  const statusLabel =
    params.status === 'accepted'
      ? 'accepted'
      : params.status === 'declined'
        ? 'declined'
        : 'picked up';

  await createNotifications({
    recipientUserIds: adminIds,
    type: 'courier_assigned',
    title: 'Courier assignment updated',
    message: `${params.courierName || 'Courier'} ${statusLabel} order #${params.orderId.toString().slice(-6)}.`,
    orderId: params.orderId,
    metadata: {
      restaurantId: params.restaurantId.toString(),
      courierAssignmentStatus: params.status,
    },
  });
};

export const notifyRestaurantAdminsAboutFailedDeliveryRequest = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  courierName?: string | null;
  reason?: string | null;
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);

  if (adminIds.length === 0) {
    return;
  }

  const reason = params.reason?.trim() ? ` Reason: ${params.reason.trim()}` : '';

  await createNotifications({
    recipientUserIds: adminIds,
    type: 'order_canceled',
    title: 'Failed delivery needs review',
    message: `${params.courierName || 'Courier'} reported customer unavailable for order #${params.orderId.toString().slice(-6)}.${reason}`,
    orderId: params.orderId,
    metadata: {
      restaurantId: params.restaurantId.toString(),
      failedDeliveryRequested: true,
    },
  });
};

export const notifyFailedDeliveryCancellationVerified = async (params: {
  userId: string | mongoose.Types.ObjectId;
  courierId?: string | mongoose.Types.ObjectId | null;
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  verifiedBy: 'restaurant_owner' | 'super_admin';
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);
  const orderNumber = params.orderId.toString().slice(-6);
  const verifierLabel = params.verifiedBy === 'super_admin' ? 'super admin' : 'restaurant owner';

  await Promise.all([
    createNotifications({
      recipientUserIds: [params.userId],
      type: 'order_canceled',
      title: 'Order canceled',
      message: `Order #${orderNumber} was canceled after a failed delivery verification by ${verifierLabel}.`,
      orderId: params.orderId,
      metadata: { orderStatus: 'canceled', canceledBy: params.verifiedBy },
    }),
    createNotifications({
      recipientUserIds: params.courierId ? [params.courierId] : [],
      type: 'order_canceled',
      title: 'Failed delivery verified',
      message: `Order #${orderNumber} was canceled by ${verifierLabel}. You can continue with another delivery.`,
      orderId: params.orderId,
      metadata: { orderStatus: 'canceled', canceledBy: params.verifiedBy },
    }),
    createNotifications({
      recipientUserIds: adminIds,
      type: 'order_canceled',
      title: 'Failed delivery canceled',
      message: `Order #${orderNumber} was canceled by ${verifierLabel} after customer unavailable verification.`,
      orderId: params.orderId,
      metadata: {
        restaurantId: params.restaurantId.toString(),
        orderStatus: 'canceled',
        canceledBy: params.verifiedBy,
      },
    }),
  ]);
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
  const superAdminIds = await findSuperAdminIds();
  const restaurantAdminIds =
    params.target === 'restaurant_support' && params.restaurantId
      ? await findRestaurantAdminIds(params.restaurantId)
      : [];
  const recipientIds =
    params.target === 'app_support' ? superAdminIds : [...restaurantAdminIds, ...superAdminIds];

  if (recipientIds.length === 0) {
    return;
  }

  await createNotifications({
    recipientUserIds: recipientIds,
    type: 'support_ticket',
    title:
      params.target === 'app_support' ? 'New app support report' : 'New restaurant problem report',
    message: `${params.reporterEmail} reported: ${params.subject}`,
    orderId: params.orderId || null,
    metadata: {
      ticketId: params.ticketId.toString(),
      restaurantId: params.restaurantId ? params.restaurantId.toString() : null,
      target: params.target,
    },
  });
};

export const notifySupportTicketReporterAboutStatus = async (params: {
  reporterId: string | mongoose.Types.ObjectId;
  ticketId: string | mongoose.Types.ObjectId;
  orderId?: string | mongoose.Types.ObjectId | null;
  status: 'in_review' | 'resolved';
  subject: string;
}) => {
  await createNotifications({
    recipientUserIds: [params.reporterId],
    type: 'support_ticket',
    title: params.status === 'in_review' ? 'Problem report in review' : 'Problem report resolved',
    message:
      params.status === 'in_review'
        ? `Your report "${params.subject}" is now being reviewed.`
        : `Your report "${params.subject}" has been resolved.`,
    orderId: params.orderId || null,
    metadata: {
      ticketId: params.ticketId.toString(),
      supportTicketStatus: params.status,
    },
  });
};

export const notifyRestaurantAdminsAboutLateOrder = async (params: {
  restaurantId: string | mongoose.Types.ObjectId;
  orderId: string | mongoose.Types.ObjectId;
  minutesSincePlaced: number;
  reason?: 'late_before_transport' | 'ready_without_courier';
}) => {
  const adminIds = await findRestaurantAdminIds(params.restaurantId);

  if (adminIds.length === 0) {
    return;
  }

  const isReadyWithoutCourier = params.reason === 'ready_without_courier';

  await createNotifications({
    recipientUserIds: adminIds,
    type: 'late_order',
    title: isReadyWithoutCourier ? 'Courier assignment warning' : 'Late order warning',
    message: isReadyWithoutCourier
      ? `Order #${params.orderId.toString().slice(-6)} is ready, but no courier has been assigned for more than 15 minutes.`
      : `Order #${params.orderId.toString().slice(-6)} has been active for ${params.minutesSincePlaced} minutes and is not out for delivery yet.`,
    orderId: params.orderId,
    metadata: {
      restaurantId: params.restaurantId.toString(),
      lateOrderAlert: isReadyWithoutCourier
        ? 'ready_without_courier_15'
        : 'placement_to_transport_120',
      minutesSincePlaced: params.minutesSincePlaced,
    },
  });
};

export const notifyOrderAutoCanceled = async (params: {
  userId?: string | mongoose.Types.ObjectId | null;
  restaurantId?: string | mongoose.Types.ObjectId | null;
  orderId: string | mongoose.Types.ObjectId;
  reason: string;
}) => {
  const adminIds = params.restaurantId ? await findRestaurantAdminIds(params.restaurantId) : [];
  const orderNumber = params.orderId.toString().slice(-6);

  await Promise.all([
    createNotifications({
      recipientUserIds: params.userId ? [params.userId] : [],
      type: 'order_canceled',
      title: 'Order canceled automatically',
      message: `Order #${orderNumber} was canceled automatically. ${params.reason}`,
      orderId: params.orderId,
      metadata: { orderStatus: 'canceled', canceledBy: 'system' },
    }),
    createNotifications({
      recipientUserIds: adminIds,
      type: 'order_canceled',
      title: 'Order auto-canceled',
      message: `Order #${orderNumber} was canceled automatically. ${params.reason}`,
      orderId: params.orderId,
      metadata: {
        restaurantId: params.restaurantId ? params.restaurantId.toString() : null,
        orderStatus: 'canceled',
        canceledBy: 'system',
      },
    }),
  ]);
};
