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
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export type MessageSummary = {
  _id: string;
  unreadCount: number;
  lastMessageAt?: string | null;
  lastMessageText?: string | null;
  contact?: {
    _id: string;
    name: string;
    image?: string | null;
    role: 'user' | 'admin' | 'courier';
  } | null;
};

type MessagesContextValue = {
  conversations: MessageSummary[];
  unreadCount: number;
  loading: boolean;
  refreshMessages: () => Promise<void>;
};

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

type MessagesProviderProps = {
  children: React.ReactNode;
};

const getEventSourceUrl = () => '/api/messages/stream';

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
  const { status } = useSession();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<MessageSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  const refreshMessages = useCallback(async () => {
    if (status !== 'authenticated') {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/messages', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const json = await response.json();
      setConversations(Array.isArray(json.conversations) ? json.conversations : []);
      setUnreadCount(Number(json.unreadCount) || 0);
    } catch {
      // Keep the UI resilient if realtime refresh fails temporarily.
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    let mounted = true;
    let eventSource: EventSource | null = null;

    const load = async () => {
      if (!mounted) {
        return;
      }
      await refreshMessages();
    };

    load();

    const interval = setInterval(load, 10000);

    try {
      eventSource = new EventSource(getEventSourceUrl());
      eventSource.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            senderUserId?: string;
            recipientUserId?: string;
            isIncoming?: boolean;
          };

          await refreshMessages();

          if (
            payload?.type === 'message-created' &&
            payload.isIncoming &&
            currentPathRef.current !== '/messages'
          ) {
            toast('New message received');
          }
        } catch {
          await refreshMessages();
        }
      };
    } catch {
      eventSource = null;
    }

    return () => {
      mounted = false;
      clearInterval(interval);
      eventSource?.close();
    };
  }, [status, refreshMessages]);

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      loading,
      refreshMessages,
    }),
    [conversations, unreadCount, loading, refreshMessages]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
};

export const useMessages = () => {
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }

  return context;
};
