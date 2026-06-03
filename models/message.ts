import { model, models, Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    deliveredAt: { type: Date, default: null, index: true },
    seenAt: { type: Date, default: null, index: true },
    editedAt: { type: Date, default: null },
    editedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedFor: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ recipientUserId: 1, seenAt: 1, createdAt: -1 });

try {
  if (models.Message) {
    delete models.Message;
  }
} catch {}

export const Message = models?.Message || model('Message', MessageSchema);
