import { model, models, Schema } from 'mongoose';

const RestaurantAvailabilityRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'notified'],
      default: 'waiting',
      index: true,
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'restaurant_availability_requests' }
);

RestaurantAvailabilityRequestSchema.index(
  { userId: 1, restaurantId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'waiting' } }
);

export const RestaurantAvailabilityRequest =
  models?.RestaurantAvailabilityRequest ||
  model('RestaurantAvailabilityRequest', RestaurantAvailabilityRequestSchema);
