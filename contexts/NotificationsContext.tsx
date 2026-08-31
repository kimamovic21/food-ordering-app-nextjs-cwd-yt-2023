'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';
import { queryKeys } from '@/libs/queryKeys';
import {
  dispatchNotificationRealtimeEvent,
  type AppNotificationRealtimePayload,
} from '@/libs/realtimeClient';
import type { AppNotification, NotificationsApiResponse } from '@/types/notifications';

export type { AppNotification } from '@/types/notifications';

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

const EMPTY_NOTIFICATIONS: AppNotification[] = [];
const getEventSourceUrl = () => '/api/notifications/stream';

const fetchNotifications = async (): Promise<NotificationsApiResponse> => {
  const response = await fetch('/api/notifications?limit=12', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to load notifications');
  }

  const json = await response.json();

  return {
    notifications: Array.isArray(json.notifications) ? json.notifications : [],
    unreadCount: Number(json.unreadCount) || 0,
  };
};

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const { playNotificationSound } = useSoundSettings();
  const previousUnreadCountRef = useRef(0);
  const hasLoadedNotificationsRef = useRef(false);
  const isAuthenticated = status === 'authenticated';

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isSuccess: hasLoadedNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    enabled: isAuthenticated,
    queryFn: fetchNotifications,
    queryKey: queryKeys.notifications.list(),
    refetchInterval: 10000,
  });

  const notifications = notificationsData?.notifications ?? EMPTY_NOTIFICATIONS;
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const loading = isAuthenticated && isNotificationsLoading;

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      previousUnreadCountRef.current = 0;
      hasLoadedNotificationsRef.current = false;
      return;
    }

    await refetchNotifications();
  }, [isAuthenticated, refetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      previousUnreadCountRef.current = 0;
      hasLoadedNotificationsRef.current = false;
      queryClient.removeQueries({ queryKey: queryKeys.notifications.all });
      return;
    }

    if (!hasLoadedNotifications) {
      return;
    }

    if (hasLoadedNotificationsRef.current && unreadCount > previousUnreadCountRef.current) {
      playNotificationSound();
    }

    previousUnreadCountRef.current = unreadCount;
    hasLoadedNotificationsRef.current = true;
  }, [hasLoadedNotifications, isAuthenticated, playNotificationSound, queryClient, unreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let eventSource: EventSource | null = null;

    const refreshQuery = async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };

    try {
      eventSource = new EventSource(getEventSourceUrl());
      eventSource.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data) as AppNotificationRealtimePayload;

          if (payload?.type === 'ready') {
            return;
          }

          dispatchNotificationRealtimeEvent(payload);
          await refreshQuery();
        } catch {
          await refreshQuery();
        }
      };
      eventSource.onerror = () => {
        // TanStack Query polling remains active as a fallback if the SSE connection drops.
      };
    } catch {
      eventSource = null;
    }

    return () => {
      eventSource?.close();
    };
  }, [isAuthenticated, queryClient]);

  const updateReadState = useCallback(
    async (notificationId: string, action: 'mark-read' | 'mark-unread') => {
      queryClient.setQueryData<NotificationsApiResponse>(
        queryKeys.notifications.list(),
        (current) => {
          if (!current) {
            return current;
          }

          const nextNotifications = current.notifications.map((notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  isRead: action === 'mark-read',
                  readAt: action === 'mark-read' ? new Date().toISOString() : null,
                }
              : notification
          );
          const nextUnreadCount = nextNotifications.filter(
            (notification) => !notification.isRead
          ).length;

          return {
            notifications: nextNotifications,
            unreadCount: nextUnreadCount,
          };
        }
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
      queryClient.setQueryData<NotificationsApiResponse>(
        queryKeys.notifications.list(),
        (current) => ({
          notifications: current?.notifications ?? [],
          unreadCount: Number(json.unreadCount) || 0,
        })
      );
    },
    [queryClient, refreshNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await updateReadState(notificationId, 'mark-read');
    },
    [updateReadState]
  );

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString();

    queryClient.setQueryData<NotificationsApiResponse>(
      queryKeys.notifications.list(),
      (current) => ({
        notifications:
          current?.notifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || readAt,
          })) ?? [],
        unreadCount: 0,
      })
    );

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
    queryClient.setQueryData<NotificationsApiResponse>(
      queryKeys.notifications.list(),
      (current) => ({
        notifications: current?.notifications ?? [],
        unreadCount: Number(json.unreadCount) || 0,
      })
    );
  }, [queryClient, refreshNotifications]);

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
