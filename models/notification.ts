import { model, models, Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order_paid', 'order_status_changed', 'courier_assigned', 'order_completed'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const Notification = models.Notification || model('Notification', NotificationSchema);
