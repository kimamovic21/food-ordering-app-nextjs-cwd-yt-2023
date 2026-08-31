import 'server-only';

import { EventEmitter } from 'node:events';
import type { NotificationRealtimeEvent } from '@/types/notifications';

export type { NotificationRealtimeEvent } from '@/types/notifications';

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
