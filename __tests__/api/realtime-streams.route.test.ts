import { getServerSession } from 'next-auth/next';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { subscribeToMessageEvents } from '@/libs/messageEvents';
import { subscribeToNotificationEvents } from '@/libs/notificationEvents';
import { User } from '@/models/user';
import type { MessageRealtimeEvent } from '@/types/messages';
import type { NotificationRealtimeEvent } from '@/types/notifications';

vi.mock('server-only', () => ({}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

const messageUnsubscribe = vi.fn();
let messageListener: ((event: MessageRealtimeEvent) => void) | null = null;

vi.mock('@/libs/messageEvents', () => ({
  subscribeToMessageEvents: vi.fn((listener: (event: MessageRealtimeEvent) => void) => {
    messageListener = listener;
    return messageUnsubscribe;
  }),
}));

const notificationUnsubscribe = vi.fn();
let notificationListener: ((event: NotificationRealtimeEvent) => void) | null = null;

vi.mock('@/libs/notificationEvents', () => ({
  subscribeToNotificationEvents: vi.fn((listener: (event: NotificationRealtimeEvent) => void) => {
    notificationListener = listener;
    return notificationUnsubscribe;
  }),
}));

const mockCurrentUser = (userId = 'user-1') => {
  vi.mocked(getServerSession).mockResolvedValueOnce({
    user: { email: `${userId}@example.com` },
  } as never);

  vi.mocked(User.findOne).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: {
          toString: () => userId,
        },
      }),
    }),
  } as never);
};

const readSsePayload = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
  const result = await reader.read();

  expect(result.done).toBe(false);

  const chunk = new TextDecoder().decode(result.value);
  const match = chunk.match(/^data: (.+)\n\n$/);

  expect(match).toBeTruthy();

  return JSON.parse(match?.[1] || '{}');
};

describe('realtime stream routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageListener = null;
    notificationListener = null;
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('rejects unauthenticated message streams', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await import('@/app/api/messages/stream/route');
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('Unauthorized');
    expect(subscribeToMessageEvents).not.toHaveBeenCalled();
  });

  it('opens a message SSE stream and only marks incoming events for the current user', async () => {
    mockCurrentUser('user-1');

    const { GET } = await import('@/app/api/messages/stream/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(subscribeToMessageEvents).toHaveBeenCalledTimes(1);

    const reader = response.body!.getReader();
    await expect(readSsePayload(reader)).resolves.toEqual({ type: 'ready' });

    messageListener?.({
      type: 'message-created',
      conversationId: 'conversation-1',
      senderUserId: 'user-2',
      recipientUserId: 'user-1',
      messageId: 'message-1',
      unreadCount: 3,
    });

    await expect(readSsePayload(reader)).resolves.toEqual({
      type: 'message-created',
      conversationId: 'conversation-1',
      senderUserId: 'user-2',
      recipientUserId: 'user-1',
      messageId: 'message-1',
      unreadCount: 3,
      isIncoming: true,
    });

    await reader.cancel();
    expect(messageUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('opens a notification SSE stream only for the signed-in recipient', async () => {
    mockCurrentUser('recipient-1');

    const { GET } = await import('@/app/api/notifications/stream/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(subscribeToNotificationEvents).toHaveBeenCalledTimes(1);

    const reader = response.body!.getReader();
    await expect(readSsePayload(reader)).resolves.toEqual({ type: 'ready' });

    notificationListener?.({
      type: 'notification-created',
      recipientUserId: 'recipient-1',
      notificationId: 'notification-1',
      notificationType: 'order_completed',
      title: 'Order completed',
      message: 'Your order has been completed.',
      unreadCount: 1,
    });

    await expect(readSsePayload(reader)).resolves.toEqual({
      type: 'notification-created',
      recipientUserId: 'recipient-1',
      notificationId: 'notification-1',
      notificationType: 'order_completed',
      title: 'Order completed',
      message: 'Your order has been completed.',
      unreadCount: 1,
      isIncoming: true,
    });

    await reader.cancel();
    expect(notificationUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
