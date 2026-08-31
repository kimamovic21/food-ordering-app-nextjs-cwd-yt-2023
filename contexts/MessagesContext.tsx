'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';
import { queryKeys } from '@/libs/queryKeys';
import type { MessageSummary, MessagesSummaryApiResponse } from '@/types/messages';

export type { MessageSummary } from '@/types/messages';

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

const EMPTY_CONVERSATIONS: MessageSummary[] = [];
const getEventSourceUrl = () => '/api/messages/stream';

const fetchMessages = async (): Promise<MessagesSummaryApiResponse> => {
  const response = await fetch('/api/messages', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to load messages');
  }

  const json = await response.json();

  return {
    conversations: Array.isArray(json.conversations) ? json.conversations : [],
    unreadCount: Number(json.unreadCount) || 0,
  };
};

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
  const { status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { playMessageSound } = useSoundSettings();
  const currentPathRef = useRef(pathname);
  const previousUnreadCountRef = useRef(0);
  const hasLoadedMessagesRef = useRef(false);
  const isAuthenticated = status === 'authenticated';

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isSuccess: hasLoadedMessages,
    refetch: refetchMessages,
  } = useQuery({
    enabled: isAuthenticated,
    queryFn: fetchMessages,
    queryKey: queryKeys.messages.summary(),
    refetchInterval: 10000,
  });

  const conversations = messagesData?.conversations ?? EMPTY_CONVERSATIONS;
  const unreadCount = messagesData?.unreadCount ?? 0;
  const loading = isAuthenticated && isMessagesLoading;

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  const refreshMessages = useCallback(async () => {
    if (!isAuthenticated) {
      previousUnreadCountRef.current = 0;
      hasLoadedMessagesRef.current = false;
      return;
    }

    await refetchMessages();
  }, [isAuthenticated, refetchMessages]);

  useEffect(() => {
    if (!isAuthenticated) {
      previousUnreadCountRef.current = 0;
      hasLoadedMessagesRef.current = false;
      queryClient.removeQueries({ queryKey: queryKeys.messages.all });
      return;
    }

    if (!hasLoadedMessages) {
      return;
    }

    if (hasLoadedMessagesRef.current && unreadCount > previousUnreadCountRef.current) {
      playMessageSound();
    }

    previousUnreadCountRef.current = unreadCount;
    hasLoadedMessagesRef.current = true;
  }, [hasLoadedMessages, isAuthenticated, playMessageSound, queryClient, unreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let eventSource: EventSource | null = null;

    const refreshQuery = async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    };

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

          await refreshQuery();

          if (
            payload?.type === 'message-created' &&
            payload.isIncoming &&
            currentPathRef.current !== '/messages'
          ) {
            sonnerToast.info('New message received');
          }
        } catch {
          await refreshQuery();
        }
      };
    } catch {
      eventSource = null;
    }

    return () => {
      eventSource?.close();
    };
  }, [isAuthenticated, queryClient]);

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
