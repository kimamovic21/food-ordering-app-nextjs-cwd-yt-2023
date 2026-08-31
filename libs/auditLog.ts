import { AuditLog } from '@/models/auditLog';
import type { CreateAuditLogInput } from '@/types/audit-log';

export type { AuditActor, CreateAuditLogInput } from '@/types/audit-log';

const toId = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return value.toString();
  }
  return String(value);
};

export const createAuditLog = async ({
  actor,
  action,
  entityType,
  entityId,
  restaurantId,
  orderId,
  metadata = {},
}: CreateAuditLogInput) => {
  try {
    await AuditLog.create({
      actorId: actor?._id || null,
      actorEmail: actor?.email || '',
      actorRole: actor?.role || '',
      action,
      entityType,
      entityId: toId(entityId) || '',
      restaurantId: restaurantId || null,
      orderId: orderId || null,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
