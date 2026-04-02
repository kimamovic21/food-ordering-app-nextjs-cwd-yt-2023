import { model, models, Schema } from 'mongoose';

const isValidIntegerRating = (value: number) => Number.isInteger(value);

const ReviewSchema = new Schema(
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

ReviewSchema.index({ restaurantId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, restaurantId: 1, createdAt: -1 });

export const Review = models?.Review || model('Review', ReviewSchema);
