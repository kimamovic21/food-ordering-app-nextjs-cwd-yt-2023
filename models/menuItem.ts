import mongoose, { model, models, Schema } from 'mongoose';

const MenuItemSchema = new Schema(
  {
    image: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    priceType: { type: String, enum: ['single', 'double', 'triple'], default: 'single' },
    foodType: { type: String, enum: ['food', 'drink'], required: false },
    priceSmall: { type: Number, default: null },
    priceMedium: { type: Number, default: null },
    priceLarge: { type: Number, default: null },
    isAvailable: { type: Boolean, default: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true }
);

// In dev, Next.js hot-reloads can retain old models with stale collection names.
try {
  if (mongoose.models.MenuItem) {
    mongoose.deleteModel('MenuItem');
  }
} catch {}

export const MenuItem = models?.MenuItem || model('MenuItem', MenuItemSchema, 'menu_items');
