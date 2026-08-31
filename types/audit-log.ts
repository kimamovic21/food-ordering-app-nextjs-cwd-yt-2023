import type { EntityId, ISODateString } from '@/types/common';

export type AuditActor = {
  _id?: unknown;
  email?: string | null;
  role?: string | null;
};

export type CreateAuditLogInput = {
  actor?: AuditActor | null;
  action: string;
  entityType: string;
  entityId?: unknown;
  restaurantId?: unknown;
  orderId?: unknown;
  metadata?: Record<string, unknown>;
};

export type AuditLogItem = {
  _id: EntityId;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: ISODateString | null;
};
