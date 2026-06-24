import { model, models, Schema } from 'mongoose';

const CouponSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 4,
      maxlength: 20,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    discountType: {
      type: String,
      enum: ['percentage'],
      default: 'percentage',
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 5,
      max: 90,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usagePerCustomer: {
      type: Number,
      default: 1,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    terms: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

try {
  if (models.Coupon) {
    delete models.Coupon;
  }
} catch {}

export const Coupon = models?.Coupon || model('Coupon', CouponSchema);
