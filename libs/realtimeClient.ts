'use client';

import type { AppNotificationRealtimePayload } from '@/types/notifications';

export const APP_NOTIFICATION_REALTIME_EVENT = 'app:notification-realtime';

export type { AppNotificationRealtimePayload } from '@/types/notifications';

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
