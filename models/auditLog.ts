import { model, models, Schema } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorEmail: {
      type: String,
      default: '',
      index: true,
    },
    actorRole: {
      type: String,
      default: '',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

try {
  if (models.AuditLog) {
    delete models.AuditLog;
  }
} catch {}

export const AuditLog = models?.AuditLog || model('AuditLog', AuditLogSchema);
