import 'server-only';

import { EventEmitter } from 'node:events';

export type MessageRealtimeEvent = {
  type: 'message-created' | 'message-updated' | 'conversation-hidden' | 'conversation-read';
  conversationId: string;
  senderUserId?: string;
  recipientUserId?: string;
  messageId?: string;
  unreadCount?: number;
};

const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(0);

export const emitMessageEvent = (event: MessageRealtimeEvent) => {
  messageEmitter.emit('message-event', event);
};

export const subscribeToMessageEvents = (listener: (event: MessageRealtimeEvent) => void) => {
  messageEmitter.on('message-event', listener);

  return () => {
    messageEmitter.off('message-event', listener);
  };
};
