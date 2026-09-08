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
    deliveryAddresses: () => [...queryKeys.profile.all, 'delivery-addresses'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    ids: () => [...queryKeys.favorites.all, 'ids'] as const,
    menuItems: () => [...queryKeys.favorites.all, 'menu-items'] as const,
    restaurants: () => [...queryKeys.favorites.all, 'restaurants'] as const,
  },
  restaurants: {
    all: ['restaurants'] as const,
    orderingStatus: (restaurantId: string) =>
      [...queryKeys.restaurants.all, 'ordering-status', restaurantId] as const,
  },
  restaurantOperations: {
    all: ['restaurant-operations'] as const,
    overview: () => [...queryKeys.restaurantOperations.all, 'overview'] as const,
  },
  orders: {
    all: ['orders'] as const,
    active: () => [...queryKeys.orders.all, 'active'] as const,
  },
  soundSettings: {
    all: ['sound-settings'] as const,
    messages: () => [...queryKeys.soundSettings.all, 'messages'] as const,
    notifications: () => [...queryKeys.soundSettings.all, 'notifications'] as const,
  },
} as const;
