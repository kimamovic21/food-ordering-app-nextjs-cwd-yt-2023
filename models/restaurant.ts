import { model, models, Schema } from 'mongoose';

const WorkingHoursSchema = new Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    openTime: { type: String, required: true }, // Format: "09:00"
    closeTime: { type: String, required: true }, // Format: "21:00"
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const BlockedDateSchema = new Schema(
  {
    date: { type: Date, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const RestaurantSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    webAddress: { type: String, default: '' },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 200,
    },
    tax: {
      type: Number,
      required: true,
      default: 17,
      min: 0,
      max: 100,
    },
    courierFee: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    averagePreparationMinutes: {
      type: Number,
      required: true,
      default: 25,
      min: 0,
      max: 240,
    },
    averageDeliveryMinutes: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
      max: 240,
    },
    activeOrderLimit: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    deliveryRadiusKm: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 15,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pauseReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    workingHours: {
      type: [WorkingHoursSchema],
      required: true,
      default: [
        { day: 'monday', openTime: '09:00', closeTime: '21:00', isClosed: false },
        { day: 'tuesday', openTime: '09:00', closeTime: '21:00', isClosed: false },
        { day: 'wednesday', openTime: '09:00', closeTime: '21:00', isClosed: false },
        { day: 'thursday', openTime: '09:00', closeTime: '21:00', isClosed: false },
        { day: 'friday', openTime: '09:00', closeTime: '23:00', isClosed: false },
        { day: 'saturday', openTime: '09:00', closeTime: '23:00', isClosed: false },
        { day: 'sunday', openTime: '10:00', closeTime: '21:00', isClosed: false },
      ],
    },
    blockedDates: {
      type: [BlockedDateSchema],
      default: [],
    },
    totalEmployees: {
      type: Number,
      default: 1,
      min: 1,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed',
      },
    },
  },
  { timestamps: true }
);

// In dev, Next.js hot-reloads can retain old models. Ensure schema updates take effect.
try {
  if (models.Restaurant) {
    delete models.Restaurant;
  }
} catch {}

export const Restaurant = models?.Restaurant || model('Restaurant', RestaurantSchema);
