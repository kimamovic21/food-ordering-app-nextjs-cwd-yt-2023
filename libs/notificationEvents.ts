import 'server-only';

import { EventEmitter } from 'node:events';

export type NotificationRealtimeEvent = {
  type: 'notification-created' | 'notifications-read';
  recipientUserId: string;
  notificationId?: string;
  notificationType?: string;
  orderId?: string | null;
  title?: string;
  message?: string;
  unreadCount?: number;
  metadata?: Record<string, unknown> | null;
};

const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(0);

export const emitNotificationEvent = (event: NotificationRealtimeEvent) => {
  notificationEmitter.emit('notification-event', event);
};

export const subscribeToNotificationEvents = (
  listener: (event: NotificationRealtimeEvent) => void
) => {
  notificationEmitter.on('notification-event', listener);

  return () => {
    notificationEmitter.off('notification-event', listener);
  };
};
