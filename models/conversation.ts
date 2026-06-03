import { model, models, Schema } from 'mongoose';

const ConversationSchema = new Schema(
  {
    participantUserIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length === 2,
        message: 'Conversation must have exactly two participants',
      },
    },
    participantKey: { type: String, required: true, unique: true, index: true },
    contextType: {
      type: String,
      enum: ['direct', 'restaurant', 'order'],
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null, index: true },
    hiddenFor: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

ConversationSchema.index({ participantUserIds: 1, lastMessageAt: -1 });
ConversationSchema.index({ contextType: 1, orderId: 1, restaurantId: 1 });

try {
  if (models.Conversation) {
    delete models.Conversation;
  }
} catch {}

export const Conversation = models?.Conversation || model('Conversation', ConversationSchema);
