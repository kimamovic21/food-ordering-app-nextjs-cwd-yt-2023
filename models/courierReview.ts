import mongoose, { model, models, Schema } from 'mongoose';

const isValidIntegerRating = (value: number) => Number.isInteger(value);

const CourierReviewSchema = new Schema(
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
      index: true,
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

CourierReviewSchema.index({ orderId: 1, userId: 1, courierId: 1 }, { unique: true });
CourierReviewSchema.index({ courierId: 1, createdAt: -1 });
CourierReviewSchema.index({ userId: 1, courierId: 1, createdAt: -1 });

// In dev, Next.js hot-reloads can retain old models with stale collection names.
try {
  if (mongoose.models.CourierReview) {
    mongoose.deleteModel('CourierReview');
  }
} catch {}

export const CourierReview =
  models?.CourierReview || model('CourierReview', CourierReviewSchema, 'courier_reviews');
