import { getServerSession } from 'next-auth/next';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import { emitMessageEvent } from '@/libs/messageEvents';
import { resolveConversationContext } from '@/libs/messages';

vi.mock('server-only', () => ({}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn((value: string) => value !== 'invalid-id'),
      },
    },
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

vi.mock('@/models/conversation', () => ({
  Conversation: {
    create: vi.fn(),
    updateOne: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/message', () => ({
  Message: {
    create: vi.fn(),
    countDocuments: vi.fn(),
    updateMany: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('@/libs/messageEvents', () => ({
  emitMessageEvent: vi.fn(),
}));

vi.mock('@/libs/messages', () => ({
  isValidObjectId: vi.fn((value: string) => Boolean(value && value !== 'invalid-id')),
  buildConversationSummary: vi.fn(async () => []),
  resolveMessageContacts: vi.fn(async () => []),
  searchAdminMessageContacts: vi.fn(async () => ({
    contacts: [],
    hasMore: false,
    page: 1,
    total: 0,
  })),
  resolveConversationContext: vi.fn(),
}));

const loadRoute = async () => await import('@/app/api/messages/route');

const mockCurrentUser = (user = { _id: 'user-1', name: 'User', role: 'user' }) => {
  vi.mocked(getServerSession).mockResolvedValueOnce({
    user: { email: 'user@example.com' },
  } as never);

  vi.mocked(User.findOne).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(user),
    }),
  } as never);
};

describe('/api/messages route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when session is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/messages'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects empty message text before resolving a recipient', async () => {
    mockCurrentUser();

    const { POST } = await loadRoute();
    const res = await POST(
      new Request('http://localhost/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: '507f1f77bcf86cd799439011',
          text: '   ',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Message cannot be empty' });
    expect(resolveConversationContext).not.toHaveBeenCalled();
  });

  it('creates a new conversation and emits a message-created event', async () => {
    mockCurrentUser({ _id: 'sender-1', name: 'Sender', role: 'admin' });

    vi.mocked(resolveConversationContext).mockResolvedValueOnce({
      recipient: { _id: 'recipient-1', name: 'Recipient', role: 'courier', image: null },
      sender: { _id: 'sender-1', name: 'Sender', role: 'admin', image: null },
      conversation: null,
      contextType: 'direct',
      participantIds: ['sender-1', 'recipient-1'],
      participantKey: 'direct:recipient-1:sender-1',
      orderId: null,
      restaurantId: null,
    } as never);

    vi.mocked(Conversation.create).mockResolvedValueOnce({
      _id: 'conversation-1',
    } as never);
    vi.mocked(Conversation.updateOne).mockResolvedValueOnce({ acknowledged: true } as never);
    vi.mocked(Message.create).mockResolvedValueOnce({
      _id: 'message-1',
      senderUserId: { toString: () => 'sender-1' },
      recipientUserId: { toString: () => 'recipient-1' },
      body: 'Hello courier',
      deliveredAt: null,
      seenAt: null,
      editedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never);
    vi.mocked(Message.countDocuments).mockResolvedValueOnce(1 as never);

    const { POST } = await loadRoute();
    const res = await POST(
      new Request('http://localhost/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: '507f1f77bcf86cd799439011',
          text: ' Hello courier ',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.conversationId).toBe('conversation-1');
    expect(body.message.body).toBe('Hello courier');
    expect(Conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        participantKey: 'direct:recipient-1:sender-1',
        lastMessageText: 'Hello courier',
      })
    );
    expect(emitMessageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'message-created',
        conversationId: 'conversation-1',
        senderUserId: 'sender-1',
        recipientUserId: 'recipient-1',
        messageId: 'message-1',
        unreadCount: 1,
      })
    );
  });

  it('marks a conversation as seen only for the current recipient', async () => {
    mockCurrentUser({ _id: 'recipient-1', name: 'Recipient', role: 'courier' });

    vi.mocked(Conversation.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: 'conversation-1',
        participantUserIds: ['sender-1', 'recipient-1'],
      }),
    } as never);
    vi.mocked(Message.updateMany).mockResolvedValueOnce({ modifiedCount: 2 } as never);
    vi.mocked(Message.countDocuments).mockResolvedValueOnce(0 as never);

    const { PATCH } = await loadRoute();
    const res = await PATCH(
      new Request('http://localhost/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-seen',
          conversationId: '507f1f77bcf86cd799439011',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, unreadCount: 0 });
    expect(Message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conversation-1',
        recipientUserId: 'recipient-1',
        seenAt: null,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          seenAt: expect.any(Date),
          deliveredAt: expect.any(Date),
        }),
      })
    );
  });
});
