import 'server-only';

import { EventEmitter } from 'node:events';
import type { MessageRealtimeEvent } from '@/types/messages';

export type { MessageRealtimeEvent } from '@/types/messages';

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
