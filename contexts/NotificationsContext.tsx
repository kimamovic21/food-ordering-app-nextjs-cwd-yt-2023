'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

export type AppNotification = {
  _id: string;
  type:
    | 'order_placed'
    | 'order_paid'
    | 'order_status_changed'
    | 'courier_assigned'
    | 'order_completed'
    | 'order_canceled'
    | 'support_ticket';
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

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=12', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const json = await response.json();
      setNotifications(Array.isArray(json.notifications) ? json.notifications : []);
      setUnreadCount(Number(json.unreadCount) || 0);
    } catch {
      // Do not break UI due to temporary polling failures.
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let mounted = true;

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

    return () => {
      mounted = false;
      clearInterval(interval);
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
