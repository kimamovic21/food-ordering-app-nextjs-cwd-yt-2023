import mongoose from 'mongoose';
import { MenuItem } from '@/models/menuItem';
import type { CartSize } from '@/types/cart';

const normalizeSize = (value: unknown, priceType?: string): CartSize => {
  const size = String(value || '').toLowerCase();

  if (priceType === 'single') return 'single';
  if (size.includes('large')) return 'large';
  if (size.includes('medium')) return 'medium';
  if (size.includes('small')) return 'small';

  return 'single';
};

const getMenuItemPrice = (menuItem: any, size: CartSize, fallbackPrice: number) => {
  if (size === 'large' && typeof menuItem.priceLarge === 'number') return menuItem.priceLarge;
  if (size === 'medium' && typeof menuItem.priceMedium === 'number') return menuItem.priceMedium;
  if (
    (size === 'small' || size === 'single') &&
    typeof menuItem.priceSmall === 'number' &&
    menuItem.priceSmall > 0
  ) {
    return menuItem.priceSmall;
  }

  return fallbackPrice;
};

export const buildCartItemsFromOrderProducts = async (cartProducts: any[]) => {
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    throw new Error('This order has no menu items to reorder');
  }

  const productIds = cartProducts
    .map((item: any) => item.productId?.toString?.() || String(item.productId || ''))
    .filter((id: string) => mongoose.Types.ObjectId.isValid(id));

  if (productIds.length !== cartProducts.length) {
    throw new Error('This order contains invalid menu items');
  }

  const menuItems = await MenuItem.find({ _id: { $in: productIds } })
    .select(
      '_id name description image priceType priceSmall priceMedium priceLarge restaurantId isAvailable'
    )
    .lean();
  const menuItemsById = new Map(menuItems.map((item: any) => [item._id.toString(), item]));

  const cartItems = cartProducts.map((product: any) => {
    const productId = product.productId?.toString?.() || String(product.productId || '');
    const menuItem = menuItemsById.get(productId);

    if (!menuItem) {
      throw new Error(`${product.name || 'A menu item'} is no longer available.`);
    }

    if (menuItem.isAvailable === false) {
      throw new Error(
        `${menuItem.name || product.name || 'A menu item'} is currently unavailable.`
      );
    }

    const size = normalizeSize(product.size, menuItem.priceType);
    const price = getMenuItemPrice(menuItem, size, Number(product.price) || 0);

    return {
      _id: menuItem._id.toString(),
      name: menuItem.name,
      description: menuItem.description || '',
      image: menuItem.image || '',
      size,
      price,
      quantity: Math.max(1, Number(product.quantity) || 1),
      restaurantId: menuItem.restaurantId?.toString?.() || String(menuItem.restaurantId || ''),
    };
  });

  const restaurantIds = new Set(cartItems.map((item) => item.restaurantId));
  if (restaurantIds.size > 1) {
    throw new Error('This order cannot be reordered because it contains multiple restaurants.');
  }

  return cartItems;
};

export const createOrderPatternKey = (order: any) => {
  const restaurantId = order.restaurantId?.toString?.() || String(order.restaurantId || '');
  const products = Array.isArray(order.cartProducts) ? order.cartProducts : [];
  const itemKey = products
    .map((product: any) => {
      const productId = product.productId?.toString?.() || String(product.productId || '');
      const size = String(product.size || '').toLowerCase();
      const quantity = Math.max(1, Number(product.quantity) || 1);

      return `${productId}:${size}:${quantity}`;
    })
    .sort()
    .join('|');

  return `${restaurantId}::${itemKey}`;
};
