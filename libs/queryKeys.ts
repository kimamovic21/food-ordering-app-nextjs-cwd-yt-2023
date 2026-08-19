export const queryKeys = {
  messages: {
    all: ['messages'] as const,
    summary: () => [...queryKeys.messages.all, 'summary'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },
} as const;
