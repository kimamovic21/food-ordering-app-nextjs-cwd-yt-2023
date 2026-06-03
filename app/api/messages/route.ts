import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import {
  buildConversationSummary,
  isValidObjectId,
  resolveConversationContext,
  resolveMessageContacts,
  searchAdminMessageContacts,
} from '@/libs/messages';
import { emitMessageEvent } from '@/libs/messageEvents';

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return User.findOne({ email }).select('_id name image role restaurantId').lean();
};

const toIso = (date: Date | string | null | undefined) => {
  if (!date) {
    return null;
  }

  return new Date(date).toISOString();
};

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const participantId = url.searchParams.get('participantId');
  const orderId = url.searchParams.get('orderId');
  const context = url.searchParams.get('context') as 'direct' | 'order' | 'restaurant' | null;
  const search = url.searchParams.get('search') || '';
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));

  const [conversationDocs, contactSuggestions] = await Promise.all([
    Conversation.find({
      participantUserIds: currentUser._id,
      hiddenFor: { $ne: currentUser._id },
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean(),
    currentUser.role === 'admin' && search.trim()
      ? searchAdminMessageContacts({
          currentUserId: currentUser._id,
          query: search,
          page,
          limit,
        })
      : resolveMessageContacts(currentUser as any),
  ]);

  const conversations = await buildConversationSummary({
    currentUserId: currentUser._id,
    conversationDocs,
  });

  const unreadCount = conversations.reduce(
    (count, conversation) => count + conversation.unreadCount,
    0
  );

  if (!participantId) {
    const searchResult = Array.isArray(contactSuggestions)
      ? { contacts: contactSuggestions, hasMore: false, page, total: contactSuggestions.length }
      : contactSuggestions;

    return Response.json({
      conversations,
      unreadCount,
      contactSuggestions: searchResult.contacts,
      contactSearch: search,
      contactPage: searchResult.page,
      contactHasMore: searchResult.hasMore,
      contactTotal: searchResult.total,
      selectedConversation: null,
    });
  }

  const resolution = await resolveConversationContext({
    currentUser: currentUser as any,
    recipientUserId: participantId,
    orderId,
    context,
  });

  if ('error' in resolution) {
    return Response.json(
      {
        error: resolution.error,
        conversations,
        unreadCount,
        contactSuggestions: Array.isArray(contactSuggestions)
          ? contactSuggestions
          : contactSuggestions.contacts,
        contactSearch: search,
        contactPage: page,
        contactHasMore: Array.isArray(contactSuggestions) ? false : contactSuggestions.hasMore,
        contactTotal: Array.isArray(contactSuggestions)
          ? contactSuggestions.length
          : contactSuggestions.total,
        selectedConversation: null,
      },
      { status: 400 }
    );
  }

  const selectedConversation = resolution.conversation || null;

  if (!selectedConversation) {
    return Response.json({
      conversations,
      unreadCount,
      contactSuggestions,
      selectedConversation: {
        conversation: null,
        contact: resolution.recipient,
        orderId: resolution.orderId,
        contextType: resolution.contextType,
        messages: [],
      },
    });
  }

  await Message.updateMany(
    {
      conversationId: selectedConversation._id,
      recipientUserId: currentUser._id,
      deliveredAt: null,
      deletedFor: { $ne: currentUser._id },
    },
    {
      $set: { deliveredAt: new Date() },
    }
  );

  const messageDocs = await Message.find({
    conversationId: selectedConversation._id,
    deletedFor: { $ne: currentUser._id },
  })
    .sort({ createdAt: 1 })
    .lean();

  const messages = messageDocs.map((message) => ({
    _id: message._id.toString(),
    senderUserId: message.senderUserId.toString(),
    recipientUserId: message.recipientUserId.toString(),
    body: message.body,
    deliveredAt: toIso(message.deliveredAt),
    seenAt: toIso(message.seenAt),
    editedAt: toIso(message.editedAt),
    deletedFor: (message.deletedFor || []).map((id: mongoose.Types.ObjectId) => id.toString()),
    createdAt: toIso(message.createdAt) || new Date().toISOString(),
    updatedAt: toIso(message.updatedAt) || new Date().toISOString(),
  }));

  return Response.json({
    conversations,
    unreadCount,
    contactSuggestions: Array.isArray(contactSuggestions)
      ? contactSuggestions
      : contactSuggestions.contacts,
    contactSearch: search,
    contactPage: Array.isArray(contactSuggestions) ? page : contactSuggestions.page,
    contactHasMore: Array.isArray(contactSuggestions) ? false : contactSuggestions.hasMore,
    contactTotal: Array.isArray(contactSuggestions)
      ? contactSuggestions.length
      : contactSuggestions.total,
    selectedConversation: {
      conversation: {
        _id: selectedConversation._id.toString(),
        participantIds: (selectedConversation.participantUserIds || []).map(
          (id: mongoose.Types.ObjectId) => id.toString()
        ),
        participantKey: selectedConversation.participantKey,
        contextType: selectedConversation.contextType,
        orderId: selectedConversation.orderId ? selectedConversation.orderId.toString() : null,
        restaurantId: selectedConversation.restaurantId
          ? selectedConversation.restaurantId.toString()
          : null,
        lastMessageText: selectedConversation.lastMessageText || '',
        lastMessageAt: toIso(selectedConversation.lastMessageAt),
        lastMessageSenderId: selectedConversation.lastMessageSenderId
          ? selectedConversation.lastMessageSenderId.toString()
          : null,
      },
      contact: resolution.recipient,
      orderId: resolution.orderId,
      contextType: resolution.contextType,
      messages,
    },
  });
}

export async function POST(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const recipientUserId = typeof body?.recipientUserId === 'string' ? body.recipientUserId : '';
  const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
  const context = body?.context === 'order' || body?.context === 'restaurant' ? body.context : null;

  if (!text) {
    return Response.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  if (!recipientUserId || !isValidObjectId(recipientUserId)) {
    return Response.json({ error: 'Invalid recipient' }, { status: 400 });
  }

  const resolution = await resolveConversationContext({
    currentUser: currentUser as any,
    recipientUserId,
    orderId,
    context,
  });

  if ('error' in resolution) {
    return Response.json({ error: resolution.error }, { status: 403 });
  }

  const conversation =
    resolution.conversation ||
    (await Conversation.create({
      participantUserIds: resolution.participantIds,
      participantKey: resolution.participantKey,
      contextType: resolution.contextType,
      orderId: resolution.orderId || null,
      restaurantId: resolution.restaurantId || null,
      hiddenFor: [],
      lastMessageText: text,
      lastMessageAt: new Date(),
      lastMessageSenderId: currentUser._id,
    }));

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessageText: text,
        lastMessageAt: new Date(),
        lastMessageSenderId: currentUser._id,
      },
      $pull: { hiddenFor: currentUser._id },
    }
  );

  const message = await Message.create({
    conversationId: conversation._id,
    senderUserId: currentUser._id,
    recipientUserId: resolution.recipient._id,
    body: text,
  });

  const unreadCount = await Message.countDocuments({
    recipientUserId: resolution.recipient._id,
    seenAt: null,
    deletedFor: { $ne: resolution.recipient._id },
  });

  emitMessageEvent({
    type: 'message-created',
    conversationId: conversation._id.toString(),
    senderUserId: currentUser._id.toString(),
    recipientUserId: resolution.recipient._id,
    messageId: message._id.toString(),
    unreadCount,
  });

  return Response.json({
    success: true,
    conversationId: conversation._id.toString(),
    message: {
      _id: message._id.toString(),
      senderUserId: message.senderUserId.toString(),
      recipientUserId: message.recipientUserId.toString(),
      body: message.body,
      deliveredAt: toIso(message.deliveredAt),
      seenAt: toIso(message.seenAt),
      editedAt: toIso(message.editedAt),
      deletedFor: [],
      createdAt: toIso(message.createdAt),
      updatedAt: toIso(message.updatedAt),
    },
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const action = body?.action;
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
  const messageId = typeof body?.messageId === 'string' ? body.messageId : '';
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (!isValidObjectId(conversationId)) {
    return Response.json({ error: 'Invalid conversation' }, { status: 400 });
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participantUserIds: currentUser._id,
  }).lean();

  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (action === 'mark-seen') {
    await Message.updateMany(
      {
        conversationId: conversation._id,
        recipientUserId: currentUser._id,
        seenAt: null,
        deletedFor: { $ne: currentUser._id },
      },
      {
        $set: {
          seenAt: new Date(),
          deliveredAt: new Date(),
        },
      }
    );

    const unreadCount = await Message.countDocuments({
      recipientUserId: currentUser._id,
      seenAt: null,
      deletedFor: { $ne: currentUser._id },
    });

    emitMessageEvent({
      type: 'conversation-read',
      conversationId: conversation._id.toString(),
      senderUserId: currentUser._id.toString(),
      unreadCount,
    });

    return Response.json({ success: true, unreadCount });
  }

  if (action === 'hide-conversation') {
    await Conversation.updateOne(
      { _id: conversation._id },
      { $addToSet: { hiddenFor: currentUser._id } }
    );

    emitMessageEvent({
      type: 'conversation-hidden',
      conversationId: conversation._id.toString(),
      senderUserId: currentUser._id.toString(),
      recipientUserId: currentUser._id.toString(),
    });

    return Response.json({ success: true });
  }

  if (action === 'edit-message') {
    if (!isValidObjectId(messageId) || !text) {
      return Response.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId: conversation._id,
      senderUserId: currentUser._id,
      deletedFor: { $ne: currentUser._id },
    });

    if (!message) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    message.body = text;
    message.editedAt = new Date();
    message.editedByUserId = currentUser._id;
    await message.save();

    emitMessageEvent({
      type: 'message-updated',
      conversationId: conversation._id.toString(),
      senderUserId: currentUser._id.toString(),
      recipientUserId: message.recipientUserId.toString(),
      messageId: message._id.toString(),
    });

    return Response.json({ success: true });
  }

  if (action === 'delete-message') {
    if (!isValidObjectId(messageId)) {
      return Response.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId: conversation._id,
      deletedFor: { $ne: currentUser._id },
    });

    if (!message) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    await Message.updateOne(
      { _id: message._id },
      {
        $addToSet: { deletedFor: currentUser._id },
      }
    );

    emitMessageEvent({
      type: 'message-updated',
      conversationId: conversation._id.toString(),
      senderUserId: currentUser._id.toString(),
      recipientUserId: message.senderUserId.toString(),
      messageId: message._id.toString(),
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
