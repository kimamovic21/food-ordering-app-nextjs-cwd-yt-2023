import 'server-only';

import mongoose from 'mongoose';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import { Order } from '@/models/order';
import { User } from '@/models/user';

export type MessageRole = 'user' | 'admin' | 'courier';

export type MessageContact = {
  userId: string;
  name: string;
  image?: string | null;
  role: MessageRole;
  href: string;
  title: string;
  subtitle: string;
  contextType: 'direct' | 'order';
  orderId?: string | null;
  restaurantId?: string | null;
};

export type PagedContactSearchResult = {
  contacts: MessageContact[];
  hasMore: boolean;
  page: number;
  total: number;
};

export type ConversationSummary = {
  _id: string;
  participantIds: string[];
  participantKey: string;
  contextType: 'direct' | 'restaurant' | 'order';
  orderId?: string | null;
  restaurantId?: string | null;
  lastMessageText: string;
  lastMessageAt?: string | null;
  lastMessageSenderId?: string | null;
  unreadCount: number;
  contact: MessageContact | null;
};

export type ConversationThreadMessage = {
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

export type MessageProfile = {
  _id: string;
  name: string;
  image?: string | null;
  role: MessageRole;
  restaurantId?: string | null;
};

export const isValidObjectId = (value: string | null | undefined) =>
  Boolean(value && mongoose.Types.ObjectId.isValid(value));

export const buildParticipantKey = (participantIds: Array<string | mongoose.Types.ObjectId>) =>
  participantIds
    .map((participantId) => participantId.toString())
    .filter(Boolean)
    .sort()
    .join(':');

export const buildConversationKey = (params: {
  contextType: 'direct' | 'restaurant' | 'order';
  participantIds: Array<string | mongoose.Types.ObjectId>;
  orderId?: string | mongoose.Types.ObjectId | null;
  restaurantId?: string | mongoose.Types.ObjectId | null;
}) => {
  const participantKey = buildParticipantKey(params.participantIds);

  if (params.contextType === 'order') {
    return `order:${params.orderId?.toString() || 'none'}:${participantKey}`;
  }

  if (params.contextType === 'restaurant') {
    return `restaurant:${params.restaurantId?.toString() || 'none'}:${participantKey}`;
  }

  return `direct:${participantKey}`;
};

export const isDirectConversationAllowed = (
  senderRole: MessageRole,
  recipientRole: MessageRole
) => {
  if (senderRole === 'admin') return true;
  if (senderRole === 'courier' && recipientRole === 'admin') return true;
  return false;
};

export const buildMessageHref = (contact: MessageContact) => {
  const params = new URLSearchParams();
  params.set('participantId', contact.userId);

  if (contact.orderId) {
    params.set('orderId', contact.orderId);
  }

  if (contact.contextType) {
    params.set('context', contact.contextType);
  }

  const query = params.toString();
  return query ? `/messages?${query}` : '/messages';
};

const buildContactFromProfile = (
  profile: MessageProfile,
  params: Omit<MessageContact, 'userId' | 'name' | 'image' | 'role' | 'href'>
): MessageContact => ({
  userId: profile._id,
  name: profile.name,
  image: profile.image || null,
  role: profile.role,
  href: buildMessageHref({
    userId: profile._id,
    name: profile.name,
    image: profile.image || null,
    role: profile.role,
    href: '',
    title: params.title,
    subtitle: params.subtitle,
    contextType: params.contextType,
    orderId: params.orderId,
    restaurantId: params.restaurantId,
  }),
  title: params.title,
  subtitle: params.subtitle,
  contextType: params.contextType,
  orderId: params.orderId,
  restaurantId: params.restaurantId,
});

const messageUserSelect = '_id name image role restaurantId';

const mapUserProfile = (user: any): MessageProfile => ({
  _id: user._id.toString(),
  name: user.name,
  image: user.image || null,
  role: user.role,
  restaurantId: user.restaurantId ? user.restaurantId.toString() : null,
});

export const dedupeMessageContacts = (contacts: MessageContact[]) => {
  const contactMap = new Map<string, MessageContact>();

  for (const contact of contacts) {
    if (!contact.userId || contactMap.has(contact.userId)) {
      continue;
    }

    contactMap.set(contact.userId, contact);
  }

  return Array.from(contactMap.values());
};

export const buildUnavailableMessageContact = (params: {
  userId: string;
  contextType: 'direct' | 'restaurant' | 'order';
  orderId?: string | null;
  restaurantId?: string | null;
}): MessageContact => ({
  userId: params.userId,
  name: 'User not available',
  image: null,
  role: 'user',
  href: '/messages',
  title: 'User not available',
  subtitle: 'This account no longer exists.',
  contextType: params.contextType === 'direct' ? 'direct' : 'order',
  orderId: params.orderId || null,
  restaurantId: params.restaurantId || null,
});

export const resolveMessageContacts = async (currentUser: {
  _id: mongoose.Types.ObjectId;
  role: MessageRole;
  restaurantId?: mongoose.Types.ObjectId | null;
}) => {
  const contacts: MessageContact[] = [];

  if (currentUser.role === 'admin') {
    const [adminProfiles, courierProfiles] = await Promise.all([
      User.find({ role: 'admin', _id: { $ne: currentUser._id } })
        .select(messageUserSelect)
        .lean(),
      User.find({ role: 'courier' }).select(messageUserSelect).lean(),
    ]);

    for (const profile of adminProfiles) {
      const mapped = mapUserProfile(profile);
      contacts.push(
        buildContactFromProfile(mapped, {
          title: mapped.name,
          subtitle: 'Direct staff chat',
          contextType: 'direct',
        })
      );
    }

    for (const profile of courierProfiles) {
      const mapped = mapUserProfile(profile);
      contacts.push(
        buildContactFromProfile(mapped, {
          title: mapped.name,
          subtitle: 'Courier direct chat',
          contextType: 'direct',
        })
      );
    }

    return dedupeMessageContacts(contacts);
  }

  if (currentUser.role === 'courier') {
    const [adminProfiles, courierOrders] = await Promise.all([
      User.find({ role: 'admin' }).select(messageUserSelect).lean(),
      Order.find({ courierId: currentUser._id })
        .select('userId restaurantId courierId orderStatus createdAt')
        .populate('userId', messageUserSelect)
        .populate({ path: 'restaurantId', select: 'ownerId name' })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    for (const profile of adminProfiles) {
      const mapped = mapUserProfile(profile);
      contacts.push(
        buildContactFromProfile(mapped, {
          title: mapped.name,
          subtitle: 'Direct staff chat',
          contextType: 'direct',
        })
      );
    }

    for (const order of courierOrders as any[]) {
      const userProfile = order.userId ? mapUserProfile(order.userId) : null;
      if (!userProfile) continue;

      contacts.push(
        buildContactFromProfile(userProfile, {
          title: userProfile.name,
          subtitle: `Order ${order._id.toString().slice(-6)} · customer`,
          contextType: 'order',
          orderId: order._id.toString(),
          restaurantId: order.restaurantId?._id?.toString() || null,
        })
      );
    }

    return dedupeMessageContacts(contacts);
  }

  const customerOrders = await Order.find({ userId: currentUser._id })
    .select('courierId restaurantId orderStatus createdAt')
    .populate('courierId', messageUserSelect)
    .populate({ path: 'restaurantId', select: 'ownerId name' })
    .sort({ createdAt: -1 })
    .lean();

  for (const order of customerOrders as any[]) {
    const courierProfile = order.courierId ? mapUserProfile(order.courierId) : null;
    if (courierProfile) {
      contacts.push(
        buildContactFromProfile(courierProfile, {
          title: courierProfile.name,
          subtitle: `Order ${order._id.toString().slice(-6)} · courier`,
          contextType: 'order',
          orderId: order._id.toString(),
          restaurantId: order.restaurantId?._id?.toString() || null,
        })
      );
    }

    const restaurantOwnerId = order.restaurantId?.ownerId;
    if (restaurantOwnerId) {
      const ownerProfile = await User.findById(restaurantOwnerId).select(messageUserSelect).lean();
      if (!ownerProfile) continue;

      const mapped = mapUserProfile(ownerProfile);
      contacts.push(
        buildContactFromProfile(mapped, {
          title: mapped.name,
          subtitle: `Order ${order._id.toString().slice(-6)} · restaurant`,
          contextType: 'order',
          orderId: order._id.toString(),
          restaurantId: order.restaurantId?._id?.toString() || null,
        })
      );
    }
  }

  return dedupeMessageContacts(contacts);
};

export const searchAdminMessageContacts = async (params: {
  currentUserId: mongoose.Types.ObjectId;
  query: string;
  page: number;
  limit: number;
}) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(20, Math.max(1, params.limit || 10));
  const search = params.query.trim();

  const filter: Record<string, unknown> = {
    _id: { $ne: params.currentUserId },
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select(messageUserSelect)
      .sort({ name: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const contacts = users.map((user: any) => {
    const profile = mapUserProfile(user);

    return buildContactFromProfile(profile, {
      title: profile.name,
      subtitle: `${profile.role} account`,
      contextType: 'direct',
    });
  });

  return {
    contacts,
    hasMore: page * limit < total,
    page,
    total,
  } satisfies PagedContactSearchResult;
};

export const resolveConversationContext = async (params: {
  currentUser: { _id: mongoose.Types.ObjectId; role: MessageRole };
  recipientUserId: string;
  orderId?: string | null;
  context?: 'direct' | 'order' | 'restaurant' | null;
}) => {
  if (!isValidObjectId(params.recipientUserId)) {
    return { error: 'Invalid recipient' as const };
  }

  const recipient = await User.findById(params.recipientUserId).select(messageUserSelect).lean();
  if (!recipient) {
    return { error: 'Recipient not found' as const };
  }

  const senderProfile = await User.findById(params.currentUser._id)
    .select(messageUserSelect)
    .lean();
  if (!senderProfile) {
    return { error: 'Sender not found' as const };
  }

  const senderRole = senderProfile.role as MessageRole;
  const recipientRole = recipient.role as MessageRole;

  const selectedContext = params.context || (params.orderId ? 'order' : 'direct');

  if (selectedContext === 'direct') {
    const participantIds = [params.currentUser._id, recipient._id];
    const participantKey = buildParticipantKey(participantIds);
    const conversation = await Conversation.findOne({
      participantKey: `direct:${participantKey}`,
      contextType: 'direct',
    }).lean();

    if (!conversation && !isDirectConversationAllowed(senderRole, recipientRole)) {
      return { error: 'This conversation is not allowed' as const };
    }

    return {
      recipient: mapUserProfile(recipient),
      sender: mapUserProfile(senderProfile),
      conversation,
      contextType: 'direct' as const,
      participantIds,
      participantKey: `direct:${participantKey}`,
      orderId: null,
      restaurantId: null,
    };
  }

  if (!params.orderId || !isValidObjectId(params.orderId)) {
    return { error: 'Invalid order context' as const };
  }

  const order = await Order.findById(params.orderId)
    .select('userId restaurantId courierId orderStatus')
    .populate({ path: 'restaurantId', select: 'ownerId name' })
    .lean();

  if (!order) {
    return { error: 'Order not found' as const };
  }

  const orderUserId = order.userId?.toString();
  const assignedCourierId = order.courierId?.toString();
  const restaurantOwnerId = order.restaurantId?.ownerId?.toString();

  const currentUserId = params.currentUser._id.toString();
  const recipientId = recipient._id.toString();

  const isUserToCourier =
    senderRole === 'user' &&
    recipientRole === 'courier' &&
    orderUserId === currentUserId &&
    assignedCourierId === recipientId;
  const isCourierToUser =
    senderRole === 'courier' &&
    recipientRole === 'user' &&
    assignedCourierId === currentUserId &&
    orderUserId === recipientId;
  const isUserToOwner =
    senderRole === 'user' &&
    recipientRole === 'admin' &&
    orderUserId === currentUserId &&
    restaurantOwnerId === recipientId;
  const isOwnerToUser =
    senderRole === 'admin' &&
    recipientRole === 'user' &&
    restaurantOwnerId === currentUserId &&
    orderUserId === recipientId;

  if (!isUserToCourier && !isCourierToUser && !isUserToOwner && !isOwnerToUser) {
    return { error: 'This order conversation is not allowed' as const };
  }

  const participantIds = [params.currentUser._id, recipient._id];
  const participantKey = `order:${order._id.toString()}:${buildParticipantKey(participantIds)}`;
  const conversation = await Conversation.findOne({
    participantKey,
    contextType: 'order',
    orderId: order._id,
  }).lean();

  return {
    recipient: mapUserProfile(recipient),
    sender: mapUserProfile(senderProfile),
    conversation,
    contextType: 'order' as const,
    participantIds,
    participantKey,
    orderId: order._id.toString(),
    restaurantId: order.restaurantId?._id?.toString() || null,
  };
};

export const resolveConversationThread = async (params: {
  currentUserId: mongoose.Types.ObjectId;
  conversationId: string;
}) => {
  if (!isValidObjectId(params.conversationId)) {
    return { error: 'Invalid conversation' as const };
  }

  const conversation = await Conversation.findOne({
    _id: params.conversationId,
    participantUserIds: params.currentUserId,
  })
    .lean()
    .catch(() => null);

  if (!conversation) {
    return { error: 'Conversation not found' as const };
  }

  return { conversation };
};

export const buildConversationSummary = async (params: {
  currentUserId: mongoose.Types.ObjectId;
  conversationDocs: any[];
}) => {
  const conversationIds = params.conversationDocs.map((conversation) => conversation._id);

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        recipientUserId: params.currentUserId,
        seenAt: null,
        deletedFor: { $ne: params.currentUserId },
      } as any,
    },
    {
      $group: {
        _id: '$conversationId',
        unreadCount: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = new Map<string, number>(
    unreadCounts.map((item) => [item._id.toString(), Number(item.unreadCount) || 0])
  );

  const participantIds = new Set<string>();
  for (const conversation of params.conversationDocs) {
    for (const participantId of conversation.participantUserIds || []) {
      participantIds.add(participantId.toString());
    }
  }

  const userProfiles = await User.find({ _id: { $in: Array.from(participantIds) } })
    .select(messageUserSelect)
    .lean();
  const profileMap = new Map(
    userProfiles.map((profile: any) => [profile._id.toString(), mapUserProfile(profile)])
  );

  return params.conversationDocs.map((conversation) => {
    const participantId = (conversation.participantUserIds || [])
      .map((id: mongoose.Types.ObjectId) => id.toString())
      .find((id: string) => id !== params.currentUserId.toString());

    const orderId = conversation.orderId ? conversation.orderId.toString() : null;
    const restaurantId = conversation.restaurantId ? conversation.restaurantId.toString() : null;
    const profileContact = participantId ? profileMap.get(participantId) || null : null;
    const contact = profileContact
      ? null
      : participantId
        ? buildUnavailableMessageContact({
            userId: participantId,
            contextType: conversation.contextType,
            orderId,
            restaurantId,
          })
        : null;

    return {
      _id: conversation._id.toString(),
      participantIds: (conversation.participantUserIds || []).map((id: mongoose.Types.ObjectId) =>
        id.toString()
      ),
      participantKey: conversation.participantKey,
      contextType: conversation.contextType,
      orderId,
      restaurantId,
      lastMessageText: conversation.lastMessageText || '',
      lastMessageAt: conversation.lastMessageAt ? conversation.lastMessageAt.toISOString() : null,
      lastMessageSenderId: conversation.lastMessageSenderId
        ? conversation.lastMessageSenderId.toString()
        : null,
      unreadCount: unreadMap.get(conversation._id.toString()) || 0,
      contact: profileContact
        ? {
            ...profileContact,
            userId: profileContact._id,
            href: buildMessageHref({
              userId: profileContact._id,
              name: profileContact.name,
              image: profileContact.image,
              role: profileContact.role,
              href: '',
              title: profileContact.name,
              subtitle: '',
              contextType: conversation.contextType === 'direct' ? 'direct' : 'order',
              orderId: orderId || undefined,
              restaurantId: restaurantId || undefined,
            }),
            title: profileContact.name,
            subtitle:
              conversation.contextType === 'direct'
                ? `Direct chat · ${profileContact.role}`
                : `Order ${String(orderId || '').slice(-6)}`,
            contextType: conversation.contextType === 'direct' ? 'direct' : 'order',
            orderId,
            restaurantId,
          }
        : contact,
    } satisfies ConversationSummary;
  });
};
