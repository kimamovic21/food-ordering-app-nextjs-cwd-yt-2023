import mongoose, { model, models, Schema } from 'mongoose';

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
RestaurantReviewSchema.index({ orderId: 1, userId: 1, restaurantId: 1 }, { unique: true });
RestaurantReviewSchema.index({ userId: 1, restaurantId: 1, createdAt: -1 });

// In dev, Next.js hot-reloads can retain old models with stale collection names.
try {
  if (mongoose.models.RestaurantReview) {
    mongoose.deleteModel('RestaurantReview');
  }
} catch {}

export const RestaurantReview =
  models?.RestaurantReview ||
  model('RestaurantReview', RestaurantReviewSchema, 'restaurant_reviews');
