'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Clock3, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/contexts/NotificationsContext';
import { resolveNotificationTargetPath, type NotificationRole } from '@/libs/notificationClient';
import type { AppNotification } from '@/contexts/NotificationsContext';

type NotificationsCenterProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  role: NotificationRole;
};

const timeAgo = (dateInput: string) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const NotificationsCenter = ({
  title,
  description,
  backHref,
  backLabel,
  role,
}: NotificationsCenterProps) => {
  const router = useRouter();
  const { markAsRead } = useNotifications();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 5;

  const fetchNotifications = async (showLoading = true, appendMode = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else if (appendMode) {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }

      const skipValue = appendMode ? offset : 0;
      const response = await fetch(`/api/notifications?limit=${ITEMS_PER_PAGE}&skip=${skipValue}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const json = await response.json();
      const newNotifications = Array.isArray(json.notifications) ? json.notifications : [];

      if (appendMode) {
        // Append new notifications to existing ones
        setNotifications((prev) => [...prev, ...newNotifications]);
        setOffset((prev) => prev + newNotifications.length);
      } else {
        // Replace all notifications (initial load or refresh)
        setNotifications(newNotifications);
        setOffset(newNotifications.length);
      }

      // Determine if there are more notifications to load
      setHasMore(newNotifications.length === ITEMS_PER_PAGE);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true, false);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
    }

    const targetPath = resolveNotificationTargetPath(notification, role);
    if (targetPath) {
      router.push(targetPath);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (loading) {
    return (
      <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3 mb-6'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-7 w-48' />
            <Skeleton className='h-4 w-72' />
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-3 mb-8'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-2xl' />
          ))}
        </div>

        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-2xl' />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className='mt-8 flex flex-col min-h-[calc(100vh-8rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex items-start gap-4'>
          <Link
            href={backHref}
            className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors'
            aria-label={backLabel}
          >
            <ArrowLeft className='h-4 w-4' />
          </Link>
          <div>
            <div className='flex items-center gap-2'>
              <Bell className='h-5 w-5 text-primary' />
              <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>{description}</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => fetchNotifications(false)}
            disabled={refreshing}
            className='rounded-full'
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-3 mb-8'>
        <Card>
          <CardContent className='p-5 flex items-center gap-4'>
            <div className='h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center'>
              <Bell className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total</p>
              <p className='text-2xl font-bold'>{notifications.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-5 flex items-center gap-4'>
            <div className='h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center'>
              <Clock3 className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Unread</p>
              <p className='text-2xl font-bold'>{unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-5 flex items-center gap-4'>
            <div className='h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center'>
              <Check className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Read</p>
              <p className='text-2xl font-bold'>{notifications.length - unreadCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className='mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'>
          {error}
        </div>
      )}

      <div className='space-y-4'>
        {notifications.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center'>
                <Bell className='h-7 w-7 text-muted-foreground' />
              </div>
              <h2 className='text-lg font-semibold'>No notifications yet</h2>
              <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
                New updates about orders, delivery status, and assignments will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`transition-colors hover:border-primary/40 ${notification.isRead ? 'opacity-80' : ''}`}
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                      <CardTitle className='text-base'>{notification.title}</CardTitle>
                      <CardDescription className='mt-1'>
                        {timeAgo(notification.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                      {notification.isRead ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {notification.message}
                  </p>

                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <Button
                      variant='outline'
                      className='rounded-full justify-start sm:justify-center'
                      onClick={() => handleNotificationClick(notification)}
                    >
                      View details
                    </Button>

                    <button
                      data-slot='button'
                      onClick={() => handleMarkAsRead(notification._id)}
                      disabled={notification.isRead}
                      className='text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-default text-left sm:text-right'
                    >
                      Mark as read
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <div className='flex justify-center mt-8'>
                <Button
                  onClick={() => fetchNotifications(false, true)}
                  disabled={loadingMore}
                  variant='outline'
                  className='rounded-full px-8'
                >
                  {loadingMore ? 'Loading more...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default NotificationsCenter;
