import { model, models, Schema } from 'mongoose';

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
    availability: { type: Boolean, default: false },
    takenOrder: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    lastLocationUpdate: { type: Date, default: null },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  },
  { timestamps: true }
);

export const User = models?.User || model('User', UserSchema);
