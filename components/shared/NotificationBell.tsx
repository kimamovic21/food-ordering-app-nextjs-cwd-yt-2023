'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { getNotificationsRoute, resolveNotificationTargetPath } from '@/libs/notificationClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useProfile from '@/hooks/useProfile';

const timeAgo = (dateInput: string) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

type NotificationBellProps = {
  iconSize?: number;
};

const NotificationBell = ({ iconSize = 22 }: NotificationBellProps) => {
  const router = useRouter();
  const session = useSession();
  const { data: profile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  if (session.status !== 'authenticated') {
    return null;
  }

  // Determine role from profile, defaulting to 'user' if not loaded
  let role: 'user' | 'courier' | 'admin' = 'user';
  if (profile?.role === 'admin') {
    role = 'admin';
  } else if (profile?.role === 'courier') {
    role = 'courier';
  }
  const notificationsRoute = getNotificationsRoute(role);
  const visibleNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification: {
    _id: string;
    isRead: boolean;
    type: string;
    orderId?: string | null;
  }) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    const path = resolveNotificationTargetPath(notification, role);
    if (path) {
      router.push(path);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAllRead) {
      return;
    }

    try {
      setIsMarkingAllRead(true);
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-slot='button'
          aria-label='Notifications'
          className='relative inline-flex h-9 w-9 items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer'
        >
          <Bell size={iconSize} />
          {unreadCount > 0 && (
            <span className='absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-[340px] max-h-[420px] p-0 overflow-x-hidden'>
        <div className='flex items-center justify-between px-3 py-2 border-b'>
          <div>
            <p className='text-sm font-semibold'>Notifications</p>
            <p className='text-xs text-muted-foreground'>Unread: {unreadCount}</p>
          </div>
        </div>

        <div className='max-h-[360px] overflow-y-auto overflow-x-hidden'>
          {visibleNotifications.length === 0 ? (
            <div className='px-3 py-8 text-sm text-muted-foreground text-center'>
              No notifications yet.
            </div>
          ) : (
            visibleNotifications.map((notification, index) => (
              <div key={notification._id}>
                <button
                  data-slot='button'
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-3 py-3 hover:bg-muted/70 transition-colors ${
                    notification.isRead ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold truncate'>{notification.title}</p>
                      <p className='text-xs text-muted-foreground mt-1 line-clamp-2 break-all'>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className='mt-1 h-2.5 w-2.5 rounded-full bg-primary' />
                    )}
                  </div>
                  <p className='text-[11px] text-muted-foreground mt-2'>
                    {timeAgo(notification.createdAt)}
                  </p>
                </button>

                <div className='px-3 pb-2 -mt-1'>
                  <button
                    data-slot='button'
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (!notification.isRead) await markAsRead(notification._id);
                    }}
                    disabled={notification.isRead}
                    className='text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-default'
                  >
                    Mark as read
                  </button>
                </div>

                {index < visibleNotifications.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))
          )}

          {visibleNotifications.length > 0 && <DropdownMenuSeparator />}

          <div className='px-3 py-3'>
            <button
              data-slot='button'
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isMarkingAllRead}
              className='mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-center text-foreground hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isMarkingAllRead ? 'Marking all as read...' : 'Mark all as read'}
            </button>

            <Link
              href={notificationsRoute}
              className='block rounded-lg border border-border px-3 py-2 text-sm font-medium text-center text-primary hover:bg-muted transition-colors'
            >
              See all notifications
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
