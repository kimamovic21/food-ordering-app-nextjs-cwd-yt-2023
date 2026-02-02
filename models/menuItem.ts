import { model, models, Schema } from 'mongoose';

const MenuItemSchema = new Schema(
  {
    image: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    foodType: { type: String, enum: ['food', 'drink'], required: true },
    priceSmall: { type: Number, default: null },
    priceMedium: { type: Number, default: null },
    priceLarge: { type: Number, default: null },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true }
);

export const MenuItem = models?.MenuItem || model('MenuItem', MenuItemSchema);
