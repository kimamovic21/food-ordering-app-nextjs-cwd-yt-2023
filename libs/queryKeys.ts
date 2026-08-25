export const queryKeys = {
  messages: {
    all: ['messages'] as const,
    center: (params: { context: string; orderId: string; participantId: string; search: string }) =>
      [...queryKeys.messages.all, 'center', params] as const,
    centerPage: (params: {
      context: string;
      orderId: string;
      page: number;
      participantId: string;
      search: string;
    }) => [...queryKeys.messages.all, 'center-page', params] as const,
    summary: () => [...queryKeys.messages.all, 'summary'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const,
  },
  soundSettings: {
    all: ['sound-settings'] as const,
    messages: () => [...queryKeys.soundSettings.all, 'messages'] as const,
    notifications: () => [...queryKeys.soundSettings.all, 'notifications'] as const,
  },
} as const;
