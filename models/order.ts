import { model, models, Schema } from 'mongoose';
import mongoose from 'mongoose';
import { createDeliveryPin } from '@/libs/deliveryPin';

const CartProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    postalCode: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    cartProducts: { type: [CartProductSchema], required: true },

    // Restaurant reference
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    // Tax and fees (dynamic from restaurant)
    taxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    estimatedPreparationMinutes: {
      type: Number,
      default: null,
      min: 0,
      max: 240,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: null,
      min: 0,
      max: 240,
    },
    estimatedTotalMinutes: {
      type: Number,
      default: null,
      min: 0,
      max: 480,
    },

    // Loyalty discount
    loyaltyDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    loyaltyTier: {
      type: String,
      default: null,
    },

    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
    },
    couponTitle: {
      type: String,
      default: null,
    },
    couponDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },
    couponMinimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: { type: Number, required: true },
    orderPaid: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    orderStatus: {
      type: String,
      enum: [
        'placed',
        'processing',
        'ready',
        'transportation',
        'delivered',
        'completed',
        'canceled',
      ],
      default: 'placed',
      required: true,
    },
    courierId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    stripeSessionId: { type: String },
    receiptEmailSentAt: { type: Date, default: null },
    deliveryPin: { type: String, default: createDeliveryPin },
    processingAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    transportationAt: { type: Date, default: null },
    courierDeliveredAt: { type: Date, default: null },
    customerConfirmedDeliveryAt: { type: Date, default: null },
    adminConfirmedDeliveryAt: { type: Date, default: null },
    deliveryCompletedBy: {
      type: String,
      enum: ['customer', 'admin', null],
      default: null,
    },
    canceledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// In dev, Next.js hot-reloads can retain old models. Ensure schema updates take effect.
try {
  if (mongoose.models.Order) {
    mongoose.deleteModel('Order');
  }
} catch {}

export const Order = models?.Order || model('Order', OrderSchema);
