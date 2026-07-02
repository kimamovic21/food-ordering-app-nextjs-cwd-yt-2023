'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import {
  ArrowLeft,
  Edit3,
  MessageSquarePlus,
  MoreVertical,
  Send,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import useProfile from '@/hooks/useProfile';
import { formatAppDateTime, formatAppTime } from '@/libs/dateFormat';

type ThreadMessage = {
  _id: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  editedAt?: string | null;
  deletedFor: string[];
  createdAt: string;
  updatedAt: string;
};

type ConversationContact = {
  _id: string;
  userId?: string;
  name: string;
  image?: string | null;
  role: 'user' | 'admin' | 'courier';
  href: string;
};

type ConversationSummary = {
  _id: string;
  participantIds: string[];
  contextType: 'direct' | 'restaurant' | 'order';
  orderId?: string | null;
  lastMessageText: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  contact: ConversationContact | null;
};

type SelectedThread = {
  conversation: {
    _id: string;
    participantIds: string[];
    participantKey: string;
    contextType: 'direct' | 'restaurant' | 'order';
    orderId?: string | null;
    lastMessageText: string;
    lastMessageAt?: string | null;
  } | null;
  contact: ConversationContact | null;
  orderId?: string | null;
  contextType: 'direct' | 'order' | 'restaurant';
  messages: ThreadMessage[];
};

type MessagesApiResponse = {
  conversations: ConversationSummary[];
  unreadCount: number;
  contactSuggestions: ConversationContact[];
  contactSearch?: string;
  contactPage?: number;
  contactHasMore?: boolean;
  contactTotal?: number;
  selectedConversation: SelectedThread | null;
};

const formatDate = (dateInput?: string | null) => {
  return formatAppTime(dateInput, '');
};

const formatShortDate = (dateInput?: string | null) => {
  return formatAppDateTime(dateInput, '');
};

const getInitials = (name?: string | null) => {
  if (!name) return 'M';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getContactId = (contact?: ConversationContact | null) =>
  contact?._id || contact?.userId || '';

const conversationCanvasClass =
  'mx-auto w-full max-w-full lg:w-[calc(100vw-5rem)] lg:max-w-[1840px] 2xl:w-[calc(100vw-6rem)] 2xl:max-w-[1920px]';
const messagesGridHeightClass =
  'min-h-[72vh] lg:h-[calc(100dvh-11rem)] lg:min-h-[560px] lg:max-h-[760px]';
const conversationGridHeightClass =
  'min-h-[68vh] lg:h-[calc(100dvh-15rem)] lg:min-h-[500px] lg:max-h-[720px]';

const MessagesLoadingSkeleton = ({ conversationOnly }: { conversationOnly: boolean }) => (
  <section className='relative mx-auto mt-8 min-h-[calc(100vh-8rem)] w-full max-w-[1920px] px-3 sm:px-5 lg:px-6 2xl:px-8'>
    {conversationOnly && (
      <div className='mb-4'>
        <Skeleton className='h-5 w-72 rounded-full' />
      </div>
    )}

    <div
      className={`grid w-full items-stretch gap-5 xl:gap-6 ${
        conversationOnly
          ? `${conversationCanvasClass} ${conversationGridHeightClass} lg:grid-cols-[minmax(0,1fr)]`
          : `${messagesGridHeightClass} lg:grid-cols-[minmax(400px,520px)_minmax(520px,1fr)] 2xl:grid-cols-[560px_minmax(720px,1fr)]`
      }`}
    >
      {!conversationOnly && (
        <Card className='min-w-0 overflow-hidden border-border/70 bg-background/90 backdrop-blur'>
          <CardHeader className='space-y-4 border-b border-border/60 pb-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-3'>
                <Skeleton className='h-8 w-44' />
                <Skeleton className='h-4 w-80 max-w-full' />
                <Skeleton className='h-4 w-64 max-w-full' />
              </div>
              <Skeleton className='h-10 w-24 rounded-full' />
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <Skeleton className='h-24 rounded-2xl' />
              <Skeleton className='h-24 rounded-2xl' />
              <Skeleton className='h-24 rounded-2xl' />
            </div>
          </CardHeader>
          <CardContent className='flex min-h-0 flex-1 flex-col gap-5 p-4'>
            <div className='space-y-3'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-20 rounded-2xl' />
              <div className='flex gap-2 overflow-hidden'>
                <Skeleton className='h-20 min-w-48 rounded-2xl' />
                <Skeleton className='h-20 min-w-48 rounded-2xl' />
              </div>
            </div>
            <Separator />
            <div className='space-y-3'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-20 rounded-2xl' />
              <Skeleton className='h-20 rounded-2xl' />
              <Skeleton className='h-20 rounded-2xl' />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='w-full min-w-0 overflow-hidden border-border/70 bg-background/90 backdrop-blur'>
        <div
          className={`flex h-full min-w-0 flex-col lg:min-h-0 ${
            conversationOnly ? 'min-h-[68vh]' : 'min-h-[72vh]'
          }`}
        >
          <CardHeader className='border-b border-border/60 pb-4'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-6 w-48' />
                  <Skeleton className='h-4 w-36' />
                </div>
              </div>
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
          </CardHeader>
          <div className='min-h-0 flex-1 space-y-4 overflow-hidden p-4 sm:p-6'>
            <Skeleton className='ml-auto h-24 w-[42%] min-w-64 rounded-3xl' />
            <Skeleton className='h-24 w-[46%] min-w-64 rounded-3xl' />
            <Skeleton className='ml-auto h-28 w-[55%] min-w-72 rounded-3xl' />
          </div>
          <div className='border-t border-border/60 p-4 sm:p-5'>
            <Skeleton className='h-16 rounded-3xl' />
          </div>
        </div>
      </Card>
    </div>
  </section>
);

const MessagesCenter = ({ title, description }: { title: string; description: string }) => {
  const params = useParams<{ participantId?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: profileData, loading: profileLoading } = useProfile();
  const [data, setData] = useState<MessagesApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ThreadMessage[]>([]);
  const [messageMenuId, setMessageMenuId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactPage, setContactPage] = useState(1);
  const [contactHasMore, setContactHasMore] = useState(false);
  const [contactLoadingMore, setContactLoadingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const participantId = params?.participantId;
  const isConversationRoute = Boolean(participantId);
  const orderId = searchParams.get('orderId');
  const context = searchParams.get('context');
  const selectedThread = data?.selectedConversation;
  const currentUserId = profileData?._id;
  const isAdminSearchEnabled = profileData?.role === 'admin';

  const loadMessages = useCallback(
    async (options?: {
      showLoading?: boolean;
      contactPage?: number;
      appendContacts?: boolean;
      searchTerm?: string;
    }) => {
      const showLoading = options?.showLoading ?? true;
      const requestedPage = options?.contactPage ?? 1;
      const appendContacts = options?.appendContacts ?? false;
      const searchTerm = options?.searchTerm ?? '';

      if (profileLoading || !profileData?._id) {
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const query = new URLSearchParams();
        if (participantId) query.set('participantId', participantId);
        if (orderId) query.set('orderId', orderId);
        if (context) query.set('context', context);
        if (isAdminSearchEnabled && searchTerm.trim()) {
          query.set('search', searchTerm.trim());
          query.set('page', String(requestedPage));
          query.set('limit', '10');
        }

        const response = await fetch(
          `/api/messages${query.toString() ? `?${query.toString()}` : ''}`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(json?.error || 'Failed to load messages');
        }

        const json = (await response.json()) as MessagesApiResponse;
        setData((prev) => {
          if (appendContacts && prev) {
            return {
              ...json,
              contactSuggestions: [...prev.contactSuggestions, ...(json.contactSuggestions || [])],
            };
          }

          return json;
        });
        setContactHasMore(Boolean(json.contactHasMore));
        setContactPage(Number(json.contactPage) || requestedPage);
        setError(null);

        if (json.selectedConversation?.messages) {
          setOptimisticMessages([]);
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load messages');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [context, isAdminSearchEnabled, orderId, participantId, profileData?._id, profileLoading]
  );

  useEffect(() => {
    if (profileLoading || !profileData?._id) {
      return;
    }

    loadMessages({ showLoading: true, contactPage: 1, searchTerm: '' });
  }, [participantId, orderId, context, profileLoading, profileData?._id, loadMessages]);

  useEffect(() => {
    if (profileLoading || !profileData?._id) {
      return;
    }

    const shouldAutoRefreshContacts = !(
      isAdminSearchEnabled &&
      contactSearch.trim() &&
      contactPage > 1
    );

    if (!shouldAutoRefreshContacts) {
      return;
    }

    const interval = setInterval(() => {
      loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
    }, 5000);

    return () => clearInterval(interval);
  }, [
    profileLoading,
    profileData?._id,
    loadMessages,
    contactPage,
    contactSearch,
    isAdminSearchEnabled,
  ]);

  useEffect(() => {
    if (!isAdminSearchEnabled) {
      setContactSearch('');
      setContactHasMore(false);
      setContactPage(1);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      loadMessages({
        showLoading: false,
        contactPage: 1,
        appendContacts: false,
        searchTerm: contactSearch,
      });
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [contactSearch, isAdminSearchEnabled, loadMessages]);

  useEffect(() => {
    const conversationId = selectedThread?.conversation?._id;
    if (!conversationId || !currentUserId) {
      return;
    }

    const eventSource = new EventSource('/api/messages/stream');
    eventSource.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          conversationId?: string;
          senderUserId?: string;
          recipientUserId?: string;
          type?: string;
        };

        if (payload.conversationId === conversationId) {
          await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
        }
      } catch {
        await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
      }
    };

    return () => eventSource.close();
  }, [selectedThread?.conversation?._id, currentUserId, loadMessages, contactPage, contactSearch]);

  useEffect(() => {
    const conversationId = selectedThread?.conversation?._id;
    if (!conversationId || !currentUserId || !selectedThread?.messages?.length) {
      return;
    }

    void fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-seen', conversationId }),
    }).then(() => loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch }));
  }, [
    selectedThread?.conversation?._id,
    selectedThread?.messages?.length,
    currentUserId,
    loadMessages,
    contactPage,
    contactSearch,
  ]);

  const visibleMessages = useMemo(() => {
    const serverMessages = selectedThread?.messages || [];
    const merged = [...serverMessages];

    for (const optimisticMessage of optimisticMessages) {
      if (!merged.find((message) => message._id === optimisticMessage._id)) {
        merged.push(optimisticMessage);
      }
    }

    return merged.sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  }, [selectedThread?.messages, optimisticMessages]);

  const visibleContacts = data?.contactSuggestions || [];

  const handleLoadMoreContacts = async () => {
    if (!isAdminSearchEnabled || !contactHasMore || contactLoadingMore) {
      return;
    }

    try {
      setContactLoadingMore(true);
      await loadMessages({
        showLoading: false,
        contactPage: contactPage + 1,
        appendContacts: true,
        searchTerm: contactSearch,
      });
    } finally {
      setContactLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [visibleMessages.length]);

  const handleSendMessage = async () => {
    if (!selectedThread?.contact || !currentUserId) {
      return;
    }

    const recipientUserId = getContactId(selectedThread.contact);
    if (!recipientUserId) {
      sonnerToast.error('Missing message recipient');
      return;
    }

    const body = draft.trim();
    if (!body) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ThreadMessage = {
      _id: tempId,
      senderUserId: currentUserId,
      recipientUserId,
      body,
      deliveredAt: null,
      seenAt: null,
      editedAt: null,
      deletedFor: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDraft('');
    setSending(true);
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId,
          text: body,
          orderId: selectedThread.orderId || orderId || null,
          context: selectedThread.contextType,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to send message');
      }

      setOptimisticMessages((prev) => prev.filter((message) => message._id !== tempId));
      await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
    } catch (sendError) {
      console.error(sendError);
      setOptimisticMessages((prev) => prev.filter((message) => message._id !== tempId));
      setDraft(body);
      sonnerToast.error(sendError instanceof Error ? sendError.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (message: ThreadMessage) => {
    setEditingMessageId(message._id);
    setDraft(message.body);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedThread?.conversation?._id) {
      return;
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-message',
          conversationId: selectedThread.conversation._id,
          messageId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
    } catch (deleteError) {
      console.error(deleteError);
      sonnerToast.error('Failed to delete message');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedThread?.conversation?._id || !editingMessageId) {
      return;
    }

    const body = draft.trim();
    if (!body) {
      return;
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit-message',
          conversationId: selectedThread.conversation._id,
          messageId: editingMessageId,
          text: body,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      setDraft('');
      setEditingMessageId(null);
      await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
    } catch (editError) {
      console.error(editError);
      sonnerToast.error('Failed to edit message');
    }
  };

  const handleHideConversation = async () => {
    if (!selectedThread?.conversation?._id) {
      return;
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hide-conversation',
          conversationId: selectedThread.conversation._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to hide conversation');
      }

      setDraft('');
      setEditingMessageId(null);
      await loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch });
      router.push('/messages');
    } catch (hideError) {
      console.error(hideError);
      sonnerToast.error('Failed to hide conversation');
    }
  };

  const activeContact = selectedThread?.contact || null;
  const activeConversation = selectedThread?.conversation || null;
  const hasSelectedContact = Boolean(activeContact);
  const totalConversations = data?.conversations.length || 0;
  const activeUnread =
    selectedThread?.messages.filter(
      (message) => message.recipientUserId === currentUserId && !message.seenAt
    ).length || 0;
  const selectedConversationLabel = activeConversation
    ? activeConversation.contextType === 'direct'
      ? 'Direct staff conversation'
      : `Order thread ${activeConversation.orderId?.slice(-6) || ''}`
    : selectedThread?.contextType === 'direct'
      ? 'Direct staff conversation'
      : selectedThread?.contextType === 'order'
        ? `Order thread ${selectedThread.orderId?.slice(-6) || ''}`
        : 'Conversation';
  const breadcrumbConversationLabel = activeContact?.name
    ? `Conversation with ${activeContact.name}`
    : 'Conversation';

  if (loading) {
    return <MessagesLoadingSkeleton conversationOnly={isConversationRoute} />;
  }

  return (
    <section className='relative mx-auto mt-8 min-h-[calc(100vh-8rem)] w-full max-w-[1920px] px-3 sm:px-5 lg:px-6 2xl:px-8'>
      {isConversationRoute && (
        <Breadcrumb className={`mb-4 ${conversationCanvasClass}`}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/messages'>All messages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbConversationLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div
        className={`grid w-full items-stretch gap-5 xl:gap-6 ${
          isConversationRoute
            ? `${conversationCanvasClass} ${conversationGridHeightClass} lg:grid-cols-[minmax(0,1fr)]`
            : `${messagesGridHeightClass} lg:grid-cols-[minmax(400px,520px)_minmax(520px,1fr)] 2xl:grid-cols-[560px_minmax(720px,1fr)]`
        }`}
      >
        {!isConversationRoute && (
          <Card className='flex h-full min-h-0 min-w-0 overflow-hidden border-border/70 bg-background/90 backdrop-blur'>
            <CardHeader className='space-y-3 border-b border-border/60 bg-linear-to-br from-foreground/5 to-transparent pb-3'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <CardTitle className='text-xl font-semibold tracking-tight'>{title}</CardTitle>
                  <p className='mt-1 text-sm leading-snug text-muted-foreground'>{description}</p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    loadMessages({ showLoading: false, contactPage, searchTerm: contactSearch })
                  }
                  disabled={refreshing}
                  className='rounded-full'
                >
                  Refresh
                </Button>
              </div>

              <div className='grid grid-cols-3 gap-2 text-sm'>
                <div className='rounded-2xl border border-border/60 bg-background px-3 py-2'>
                  <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Unread</p>
                  <p className='mt-1 text-2xl font-bold'>{data?.unreadCount || 0}</p>
                </div>
                <div className='rounded-2xl border border-border/60 bg-background px-3 py-2'>
                  <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>
                    Threads
                  </p>
                  <p className='mt-1 text-2xl font-bold'>{totalConversations}</p>
                </div>
                <div className='rounded-2xl border border-border/60 bg-background px-3 py-2'>
                  <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Open</p>
                  <p className='mt-1 text-2xl font-bold'>{activeUnread}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-4'>
              <div className='shrink-0'>
                <div className='mb-2 flex items-center justify-between'>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                    {isAdminSearchEnabled ? 'Search users' : 'Quick contacts'}
                  </h2>
                  <MessageSquarePlus className='h-4 w-4 text-muted-foreground' />
                </div>
                {isAdminSearchEnabled && (
                  <div className='mb-3 rounded-2xl border border-border/60 bg-background p-2'>
                    <div className='relative'>
                      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        value={contactSearch}
                        onChange={(event) => setContactSearch(event.target.value)}
                        autoComplete='off'
                        placeholder='Search users by name or email'
                        className='h-11 rounded-2xl pl-10'
                      />
                    </div>
                    <p className='mt-1 px-1 text-xs text-muted-foreground'>
                      Search all users, then load more results in pages of 10.
                    </p>
                  </div>
                )}

                <div className='space-y-2'>
                  <div className='flex gap-2 overflow-x-auto pb-1'>
                    {visibleContacts.slice(0, 8).map((contact) => (
                      <Link
                        key={`${getContactId(contact)}-${contact.href}`}
                        href={contact.href}
                        className='flex min-w-[180px] items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-3 py-3 transition-colors hover:border-primary/40 hover:bg-muted'
                      >
                        <Avatar className='h-10 w-10 border border-border/60'>
                          <AvatarImage src={contact.image || undefined} alt={contact.name} />
                          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium'>{contact.name}</p>
                          <p className='truncate text-xs text-muted-foreground'>{contact.role}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {isAdminSearchEnabled && contactHasMore && (
                    <div className='flex justify-center pt-1'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='rounded-full px-4'
                        onClick={handleLoadMoreContacts}
                        disabled={contactLoadingMore}
                      >
                        {contactLoadingMore ? 'Loading...' : 'Load more'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator className='shrink-0' />

              <div className='flex min-h-[220px] flex-1 flex-col space-y-2 overflow-hidden'>
                <h2 className='text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                  Inbox
                </h2>
                <div className='min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto pr-1'>
                  {(data?.conversations || []).length === 0 ? (
                    <div className='rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground'>
                      No conversations yet. Pick a contact to start the first thread.
                    </div>
                  ) : (
                    (data?.conversations || []).map((conversation) => {
                      const contact = conversation.contact;
                      return (
                        <Link
                          key={conversation._id}
                          href={contact?.href || '/messages'}
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40 ${
                            selectedThread?.conversation?._id === conversation._id
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border/60 bg-background'
                          }`}
                        >
                          <Avatar className='h-11 w-11 border border-border/60'>
                            <AvatarImage
                              src={contact?.image || undefined}
                              alt={contact?.name || 'Contact'}
                            />
                            <AvatarFallback>{getInitials(contact?.name)}</AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center justify-between gap-2'>
                              <p className='truncate font-medium'>
                                {contact?.name || 'Conversation'}
                              </p>
                              <span className='text-[11px] text-muted-foreground'>
                                {formatDate(conversation.lastMessageAt)}
                              </span>
                            </div>
                            <p className='mt-1 truncate text-sm text-muted-foreground'>
                              {conversation.lastMessageText || 'No messages yet'}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className='rounded-full px-2 py-0.5'>
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className='w-full min-w-0 overflow-hidden border-border/70 bg-background/90 backdrop-blur'>
          <div
            className={`flex h-full min-w-0 flex-col lg:min-h-0 ${
              isConversationRoute ? 'min-h-[68vh]' : 'min-h-[72vh]'
            }`}
          >
            {hasSelectedContact ? (
              <>
                <CardHeader className='border-b border-border/60 bg-linear-to-br from-foreground/5 to-transparent pb-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <Link
                        href='/messages'
                        className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 transition-colors hover:bg-muted lg:hidden'
                        aria-label='Back to inbox'
                      >
                        <ArrowLeft className='h-4 w-4' />
                      </Link>
                      <Avatar className='h-12 w-12 border border-border/60'>
                        <AvatarImage
                          src={activeContact?.image || undefined}
                          alt={activeContact?.name || ''}
                        />
                        <AvatarFallback>{getInitials(activeContact?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='flex items-center gap-2'>
                          <CardTitle className='text-xl'>
                            {activeContact?.name || 'Conversation'}
                          </CardTitle>
                          <Badge variant='secondary' className='rounded-full'>
                            {activeContact?.role || selectedThread?.contextType || 'user'}
                          </Badge>
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {selectedConversationLabel}
                        </p>
                      </div>
                    </div>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <button
                        type='button'
                        data-slot='button'
                        className='inline-flex h-8 w-8 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-red-500 shadow-none transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40'
                        aria-label={`Delete conversation with ${activeContact?.name || 'this person'}`}
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className='h-5 w-5' />
                      </button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the conversation with{' '}
                            {activeContact?.name || 'this person'} from your inbox. It will not
                            delete it for the other participant.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className='bg-red-600 text-white hover:bg-red-700'
                            onClick={() => {
                              setDeleteDialogOpen(false);
                              void handleHideConversation();
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                <div
                  ref={scrollContainerRef}
                  className='min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent)] p-4 sm:p-6'
                >
                  {visibleMessages.length === 0 ? (
                    <div className='flex h-full min-h-112 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 text-center'>
                      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
                        <MessageSquarePlus className='h-7 w-7' />
                      </div>
                      <h3 className='text-lg font-semibold'>Start the conversation</h3>
                      <p className='mt-2 max-w-md text-sm text-muted-foreground'>
                        {activeConversation
                          ? 'Send a short update, ask about the order, or coordinate the delivery in this thread.'
                          : `No previous messages yet. Send the first message to ${activeContact?.name || 'this person'}.`}
                      </p>
                    </div>
                  ) : (
                    visibleMessages.map((message) => {
                      const isOwnMessage = message.senderUserId === currentUserId;
                      const statusLabel = isOwnMessage
                        ? message.seenAt
                          ? 'Seen'
                          : message.deliveredAt
                            ? 'Delivered'
                            : 'Sent'
                        : null;

                      return (
                        <div
                          key={message._id}
                          className={`group flex w-full min-w-0 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`min-w-0 max-w-[min(82%,48rem)] overflow-visible rounded-3xl border px-4 py-3 shadow-sm transition-all ${
                              isOwnMessage
                                ? 'border-primary/20 bg-primary text-primary-foreground'
                                : 'border-border/70 bg-background'
                            } ${message._id.startsWith('temp-') ? 'opacity-70' : ''}`}
                          >
                            <div className='flex min-w-0 items-start justify-between gap-4'>
                              <p className='min-w-0 flex-1 whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed'>
                                {message.body}
                              </p>
                              {isOwnMessage && !message._id.startsWith('temp-') && (
                                <div className='relative flex items-center gap-1'>
                                  <button
                                    type='button'
                                    data-slot='button'
                                    onClick={() =>
                                      setMessageMenuId((current) =>
                                        current === message._id ? null : message._id
                                      )
                                    }
                                    className='inline-flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent p-0 opacity-0 shadow-none transition-opacity hover:bg-background/20 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/40'
                                    aria-label='Message actions'
                                  >
                                    <MoreVertical className='h-4 w-4' />
                                  </button>
                                  {messageMenuId === message._id && (
                                    <div className='absolute right-0 top-8 z-50 w-40 rounded-2xl border border-border/70 bg-background p-1 text-foreground shadow-xl'>
                                      <button
                                        type='button'
                                        data-slot='button'
                                        onClick={() => {
                                          setMessageMenuId(null);
                                          handleEditMessage(message);
                                        }}
                                        className='flex w-full items-center justify-start gap-2 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm font-medium shadow-none hover:bg-muted'
                                      >
                                        <Edit3 className='h-4 w-4' />
                                        Edit
                                      </button>
                                      <button
                                        type='button'
                                        data-slot='button'
                                        onClick={() => {
                                          setMessageMenuId(null);
                                          void handleDeleteMessage(message._id);
                                        }}
                                        className='flex w-full items-center justify-start gap-2 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-red-600 shadow-none hover:bg-red-50 dark:hover:bg-red-950/40'
                                      >
                                        <Trash2 className='h-4 w-4' />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div
                              className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                            >
                              <span>{formatShortDate(message.createdAt)}</span>
                              {message.editedAt && (
                                <span className='inline-flex rounded-full bg-background/20 px-2 py-0.5'>
                                  Edited
                                </span>
                              )}
                              {statusLabel && (
                                <span className='inline-flex rounded-full bg-background/20 px-2 py-0.5'>
                                  {statusLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className='border-t border-border/60 bg-linear-to-t from-foreground/5 to-transparent p-4 sm:p-5'>
                  {editingMessageId && (
                    <div className='mb-3 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm'>
                      <div>
                        <p className='font-medium'>Editing message</p>
                        <p className='text-xs text-muted-foreground'>
                          Fix the typo, then save your update.
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setEditingMessageId(null);
                          setDraft('');
                        }}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  )}

                  <div className='relative max-w-full min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-background transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'>
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        activeConversation
                          ? 'Write a message...'
                          : `Message ${activeContact?.name || 'this person'}...`
                      }
                      wrap='soft'
                      className='block field-sizing-fixed max-h-40 min-h-16 w-full max-w-full min-w-0 resize-none overflow-x-hidden overflow-y-auto wrap-anywhere border-0 bg-transparent py-4 pl-4 pr-20 shadow-none [overflow-wrap:anywhere] [word-break:break-word] focus-visible:ring-0'
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          if (editingMessageId) {
                            void handleSaveEdit();
                          } else {
                            void handleSendMessage();
                          }
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (editingMessageId) {
                          void handleSaveEdit();
                        } else {
                          void handleSendMessage();
                        }
                      }}
                      disabled={sending || !draft.trim()}
                      size='icon'
                      className='absolute bottom-3 right-3 h-10 w-10 rounded-full'
                      aria-label={editingMessageId ? 'Save message' : 'Send message'}
                    >
                      {editingMessageId ? (
                        <Edit3 className='h-4 w-4' />
                      ) : (
                        <Send className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex h-full min-h-[72vh] flex-col items-center justify-center px-8 text-center'>
                <div className='mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <MessageSquarePlus className='h-8 w-8' />
                </div>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  Pick a conversation to start messaging
                </h2>
                <p className='mt-3 max-w-xl text-sm text-muted-foreground'>
                  {data?.contactSuggestions?.length
                    ? 'Choose a restaurant owner, courier, or admin from the left panel. Only approved role combinations can chat here.'
                    : 'You do not have any available contacts yet. Once you place an order or get assigned to one, conversations will appear here.'}
                </p>

                <div className='mt-8 flex flex-wrap justify-center gap-3'>
                  {data?.contactSuggestions?.slice(0, 4).map((contact) => (
                    <Button
                      key={`${getContactId(contact)}-${contact.href}`}
                      asChild
                      variant='outline'
                      className='rounded-full'
                    >
                      <Link href={contact.href}>{contact.name}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {error && (
        <div className='mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'>
          {error}
        </div>
      )}
    </section>
  );
};

export default MessagesCenter;
