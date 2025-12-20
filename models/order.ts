import { model, models, Schema } from 'mongoose';

const CartProductSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  postalCode: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  cartProducts: { type: [CartProductSchema], required: true },
  total: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  stripeSessionId: { type: String },
}, { timestamps: true });

export const Order = models?.Order || model('Order', OrderSchema);
