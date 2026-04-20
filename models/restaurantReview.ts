import { model, models, Schema } from 'mongoose';

const isValidIntegerRating = (value: number) => Number.isInteger(value);

const RestaurantReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: isValidIntegerRating,
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

RestaurantReviewSchema.index({ restaurantId: 1, createdAt: -1 });
RestaurantReviewSchema.index({ userId: 1, restaurantId: 1, createdAt: -1 });

// Keep the underlying mongoose model name as "Review" to avoid data migration.
export const RestaurantReview = models?.Review || model('Review', RestaurantReviewSchema);
