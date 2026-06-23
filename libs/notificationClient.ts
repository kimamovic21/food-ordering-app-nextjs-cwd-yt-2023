export type NotificationRole = 'user' | 'courier' | 'admin';

type NotificationLike = {
  type: string;
  orderId?: string | null;
  metadata?: {
    ticketId?: string | null;
    [key: string]: unknown;
  } | null;
};

export const getNotificationsRoute = (_role: NotificationRole) => '/notifications';

export const resolveNotificationTargetPath = (
  notification: NotificationLike,
  role: NotificationRole
) => {
  if (notification.type === 'courier_assigned') {
    return '/my-delivery';
  }

  if (notification.type === 'support_ticket') {
    return notification.metadata?.ticketId
      ? `/admin-dashboard/support-tickets?ticketId=${notification.metadata.ticketId}`
      : '/admin-dashboard/support-tickets';
  }

  if (!notification.orderId) {
    return null;
  }

  if (
    role === 'admin' &&
    ['order_placed', 'order_paid', 'order_completed'].includes(notification.type)
  ) {
    return `/admin-dashboard/orders/${notification.orderId}`;
  }

  if (role === 'courier' && notification.type === 'order_completed') {
    return '/my-deliveries';
  }

  return `/my-orders/${notification.orderId}`;
};
