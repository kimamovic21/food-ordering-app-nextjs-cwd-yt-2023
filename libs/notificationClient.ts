export type NotificationRole = 'user' | 'courier' | 'admin';

type NotificationLike = {
  type: string;
  orderId?: string | null;
};

export const getNotificationsRoute = (_role: NotificationRole) => '/notifications';

export const resolveNotificationTargetPath = (
  notification: NotificationLike,
  role: NotificationRole
) => {
  if (notification.type === 'courier_assigned') {
    return '/my-delivery';
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
