import { model, models, Schema } from 'mongoose';

const UserSchema = new Schema({
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
}, { timestamps: true });


export const User = models?.User || model('User', UserSchema);