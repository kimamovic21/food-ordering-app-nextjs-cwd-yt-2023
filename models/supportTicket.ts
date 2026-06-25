import { model, models, Schema } from 'mongoose';

const SupportTicketSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterRole: {
      type: String,
      enum: ['user', 'courier', 'admin'],
      required: true,
    },
    reporterName: { type: String, default: '' },
    reporterEmail: { type: String, required: true },
    contactEmail: { type: String, default: '', trim: true, maxlength: 120 },
    contactPhone: { type: String, default: '', trim: true, maxlength: 40 },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null, index: true },
    target: {
      type: String,
      enum: ['restaurant_support', 'app_support'],
      required: true,
      default: 'restaurant_support',
    },
    category: {
      type: String,
      enum: [
        'order_issue',
        'delivery_issue',
        'food_quality',
        'missing_item',
        'wrong_item',
        'courier_issue',
        'app_issue',
        'other',
      ],
      required: true,
      default: 'order_issue',
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    responseNote: { type: String, default: '', trim: true, maxlength: 1000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'support_tickets' }
);

SupportTicketSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ target: 1, status: 1, createdAt: -1 });
SupportTicketSchema.index({ reporterId: 1, createdAt: -1 });

export const SupportTicket = models?.SupportTicket || model('SupportTicket', SupportTicketSchema);
