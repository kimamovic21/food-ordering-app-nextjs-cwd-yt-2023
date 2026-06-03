'use client';

import Link from 'next/link';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { useSession } from 'next-auth/react';
import { useMessages } from '@/contexts/MessagesContext';

type MessageBellProps = {
  iconSize?: number;
};

const MessageBell = ({ iconSize = 22 }: MessageBellProps) => {
  const session = useSession();
  const { unreadCount } = useMessages();

  if (session.status !== 'authenticated') {
    return null;
  }

  return (
    <Link
      href='/messages'
      aria-label='Messages'
      className='relative inline-flex h-9 w-9 items-center justify-center text-foreground hover:text-primary transition-colors'
    >
      <IoChatbubbleEllipsesOutline size={iconSize} />
      {unreadCount > 0 && (
        <span className='absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center'>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBell;
