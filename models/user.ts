import { model, models, Schema } from 'mongoose';

const CourierWorkingHoursSchema = new Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isUnavailable: { type: Boolean, default: false },
  },
  { _id: false }
);

const DeliveryAddressSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    deliveryLatitude: { type: Number, required: true },
    deliveryLongitude: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    password: { type: String },
    provider: { type: String, default: 'credentials' },
    phone: { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'courier'], default: 'user' },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationTokenExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetTokenExpiresAt: { type: Date, default: null },
    availability: { type: Boolean, default: false },
    courierWorkingHours: {
      type: [CourierWorkingHoursSchema],
      default: [
        { day: 'monday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
        { day: 'thursday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
        { day: 'friday', startTime: '09:00', endTime: '17:00', isUnavailable: false },
        { day: 'saturday', startTime: '10:00', endTime: '16:00', isUnavailable: true },
        { day: 'sunday', startTime: '10:00', endTime: '16:00', isUnavailable: true },
      ],
    },
    takenOrder: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    lastLocationUpdate: { type: Date, default: null },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null },
    favoriteMenuItems: {
      type: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
      default: [],
    },
    favoriteRestaurants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
      default: [],
    },
    deliveryAddresses: {
      type: [DeliveryAddressSchema],
      default: [],
    },
    notificationSoundEnabled: { type: Boolean, default: false },
    messageSoundEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = models?.User || model('User', UserSchema);
