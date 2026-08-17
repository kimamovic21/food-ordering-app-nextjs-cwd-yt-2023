'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';
import {
  dispatchNotificationRealtimeEvent,
  type AppNotificationRealtimePayload,
} from '@/libs/realtimeClient';

export type AppNotification = {
  _id: string;
  type:
    | 'order_placed'
    | 'order_paid'
    | 'order_status_changed'
    | 'courier_assigned'
    | 'order_completed'
    | 'order_canceled'
    | 'restaurant_available'
    | 'support_ticket'
    | 'late_order';
  title: string;
  message: string;
  orderId?: string | null;
  metadata?: {
    ticketId?: string | null;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

type NotificationsProviderProps = {
  children: React.ReactNode;
};

const getEventSourceUrl = () => '/api/notifications/stream';

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const { status } = useSession();
  const { playNotificationSound } = useSoundSettings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const previousUnreadCountRef = useRef(0);
  const hasLoadedNotificationsRef = useRef(false);

  const refreshNotifications = useCallback(async () => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      hasLoadedNotificationsRef.current = false;
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=12', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const json = await response.json();
      const nextUnreadCount = Number(json.unreadCount) || 0;

      setNotifications(Array.isArray(json.notifications) ? json.notifications : []);

      if (hasLoadedNotificationsRef.current && nextUnreadCount > previousUnreadCountRef.current) {
        playNotificationSound();
      }

      previousUnreadCountRef.current = nextUnreadCount;
      hasLoadedNotificationsRef.current = true;
      setUnreadCount(nextUnreadCount);
    } catch {
      // Do not break UI due to temporary polling failures.
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      hasLoadedNotificationsRef.current = false;
      return;
    }

    let mounted = true;
    let eventSource: EventSource | null = null;

    const load = async () => {
      if (!mounted) {
        return;
      }
      await refreshNotifications();
    };

    load();

    const interval = setInterval(() => {
      load();
    }, 10000);

    try {
      eventSource = new EventSource(getEventSourceUrl());
      eventSource.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data) as AppNotificationRealtimePayload;

          if (payload?.type === 'ready') {
            return;
          }

          dispatchNotificationRealtimeEvent(payload);
          await refreshNotifications();
        } catch {
          await refreshNotifications();
        }
      };
      eventSource.onerror = () => {
        // Polling remains active as a fallback if the SSE connection drops.
      };
    } catch {
      eventSource = null;
    }

    return () => {
      mounted = false;
      clearInterval(interval);
      eventSource?.close();
    };
  }, [status, refreshNotifications]);

  const updateReadState = useCallback(
    async (notificationId: string, action: 'mark-read' | 'mark-unread') => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: action === 'mark-read',
                readAt: action === 'mark-read' ? new Date().toISOString() : null,
              }
            : notification
        )
      );

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notificationId }),
      });

      if (!response.ok) {
        await refreshNotifications();
        return;
      }

      const json = await response.json();
      setUnreadCount(Number(json.unreadCount) || 0);
    },
    [refreshNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await updateReadState(notificationId, 'mark-read');
    },
    [updateReadState]
  );

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || readAt,
      }))
    );
    setUnreadCount(0);

    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' }),
    });

    if (!response.ok) {
      await refreshNotifications();
      return;
    }

    const json = await response.json();
    setUnreadCount(Number(json.unreadCount) || 0);
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, loading, refreshNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
};
