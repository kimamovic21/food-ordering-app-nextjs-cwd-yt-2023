import type { EntityId, ISODateString, MaybePopulated } from '@/types/common';
import type { OrderStatus } from '@/types/order';
import type { RestaurantSummary } from '@/types/restaurant';
import type { UserRole, UserSummary } from '@/types/user';

export type SupportTicketTarget = 'restaurant_support' | 'app_support';
export type SupportTicketStatus = 'open' | 'in_review' | 'resolved';
export type SupportTicketPriority = 'low' | 'normal' | 'high';

export type SupportTicketOrderSummary = {
  _id: EntityId;
  email: string;
  orderStatus: OrderStatus | string;
  total: number;
  createdAt: ISODateString;
};

export type SupportTicket = {
  _id: EntityId;
  reporterId?: MaybePopulated<UserSummary> | null;
  reporterRole?: UserRole | string;
  reporterName?: string;
  reporterEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  orderId?: MaybePopulated<SupportTicketOrderSummary> | null;
  restaurantId?: MaybePopulated<RestaurantSummary> | null;
  target: SupportTicketTarget;
  category: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  responseNote?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type SupportTicketStatusFilter = 'all' | SupportTicketStatus;
