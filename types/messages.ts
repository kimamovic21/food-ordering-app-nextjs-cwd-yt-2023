import type { EntityId, ISODateString } from '@/types/common';
import type { UserRole } from '@/types/user';

export type MessageRole = Extract<UserRole, 'user' | 'admin' | 'courier'>;
export type MessageContextType = 'direct' | 'restaurant' | 'order';

export type MessageContact = {
  _id?: EntityId;
  userId: EntityId;
  name: string;
  image?: string | null;
  role: MessageRole;
  href: string;
  title?: string;
  subtitle?: string;
  contextType: Extract<MessageContextType, 'direct' | 'order'>;
  orderId?: EntityId | null;
  restaurantId?: EntityId | null;
};

export type PagedContactSearchResult = {
  contacts: MessageContact[];
  hasMore: boolean;
  page: number;
  total: number;
};

export type ConversationSummary = {
  _id: EntityId;
  participantIds: EntityId[];
  participantKey?: string;
  contextType: MessageContextType;
  orderId?: EntityId | null;
  restaurantId?: EntityId | null;
  lastMessageText: string;
  lastMessageAt?: ISODateString | null;
  lastMessageSenderId?: EntityId | null;
  unreadCount: number;
  contact: MessageContact | null;
};

export type ConversationThreadMessage = {
  _id: EntityId;
  senderUserId: EntityId;
  recipientUserId: EntityId;
  body: string;
  deliveredAt?: ISODateString | null;
  seenAt?: ISODateString | null;
  editedAt?: ISODateString | null;
  deletedFor: EntityId[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type MessageProfile = {
  _id: EntityId;
  name: string;
  image?: string | null;
  role: MessageRole;
  restaurantId?: EntityId | null;
};

export type MessageSummary = Pick<
  ConversationSummary,
  '_id' | 'unreadCount' | 'lastMessageAt' | 'lastMessageText' | 'contact'
>;

export type SelectedMessageThread = {
  conversation: (ConversationSummary & { participantKey: string }) | null;
  contact: MessageContact | null;
  orderId?: EntityId | null;
  contextType: MessageContextType;
  messages: ConversationThreadMessage[];
};

export type MessagesCenterApiResponse = {
  conversations: ConversationSummary[];
  unreadCount: number;
  contactSuggestions: MessageContact[];
  contactSearch?: string;
  contactPage?: number;
  contactHasMore?: boolean;
  contactTotal?: number;
  selectedConversation: SelectedMessageThread | null;
};

export type MessagesSummaryApiResponse = {
  conversations: MessageSummary[];
  unreadCount: number;
};

export type MessagesCenterQueryParams = {
  context?: string | null;
  isAdminSearchEnabled: boolean;
  orderId?: EntityId | null;
  page?: number;
  participantId?: EntityId | null;
  searchTerm?: string;
};

export type MessageRealtimeEvent = {
  type: 'message-created' | 'message-updated' | 'conversation-hidden' | 'conversation-read';
  conversationId: EntityId;
  senderUserId?: EntityId;
  recipientUserId?: EntityId;
  messageId?: EntityId;
  unreadCount?: number;
};
