export type NotificationRole = 'user' | 'courier' | 'admin';

type NotificationLike = {
  type: string;
  orderId?: string | null;
};

export const getNotificationsRoute = (_role: NotificationRole) => '/notifications';

export const resolveNotificationTargetPath = (
  notification: NotificationLike,
  _role: NotificationRole
) => {
  if (notification.type === 'courier_assigned') {
    return '/my-delivery';
  }

  if (!notification.orderId) {
    return null;
  }

  // If it's a restaurant order notification (only admins get this), go to admin dashboard
  // Otherwise, always go to my-orders (even if user is an admin who is also ordering)
  if (notification.type === 'order_paid') {
    return `/admin-dashboard/orders/${notification.orderId}`;
  }

  // For all other notification types (order_status_changed, order_completed), use my-orders
  return `/my-orders/${notification.orderId}`;
};
