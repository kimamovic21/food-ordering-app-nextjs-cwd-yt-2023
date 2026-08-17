'use client';

export const APP_NOTIFICATION_REALTIME_EVENT = 'app:notification-realtime';

export type AppNotificationRealtimePayload = {
  type?: string;
  notificationId?: string;
  notificationType?: string;
  orderId?: string | null;
  title?: string;
  message?: string;
  unreadCount?: number;
  metadata?: Record<string, unknown> | null;
  isIncoming?: boolean;
};

export const dispatchNotificationRealtimeEvent = (payload: AppNotificationRealtimePayload) => {
  window.dispatchEvent(new CustomEvent(APP_NOTIFICATION_REALTIME_EVENT, { detail: payload }));
};

export const getNotificationRealtimePayload = (event: Event) =>
  event instanceof CustomEvent ? (event.detail as AppNotificationRealtimePayload | null) : null;

export const isOrderRelatedRealtimePayload = (
  payload: AppNotificationRealtimePayload | null | undefined,
  orderId?: string | null
) => {
  if (!payload) {
    return false;
  }

  if (!orderId) {
    return Boolean(payload.orderId);
  }

  return payload.orderId === orderId;
};
