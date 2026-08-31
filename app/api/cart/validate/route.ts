import mongoose from 'mongoose';
import { MenuItem } from '@/models/menuItem';
import type { CartSize, CartValidationRequestItem } from '@/types/cart';

const normalizeCartSize = (value: unknown): CartSize | null => {
  const size = String(value || '')
    .trim()
    .toLowerCase();

  if (size === 'single' || size === 'small' || size === 'medium' || size === 'large') {
    return size;
  }

  return null;
};

const getCartItemKey = (id: string, size: string | null) => `${id}:${size || 'invalid'}`;

const getMenuItemSizePrice = (menuItem: any, requestedSize: CartSize) => {
  const prices = [
    { size: 'small' as const, price: Number(menuItem.priceSmall) },
    { size: 'medium' as const, price: Number(menuItem.priceMedium) },
    { size: 'large' as const, price: Number(menuItem.priceLarge) },
  ].filter((entry) => Number.isFinite(entry.price) && entry.price > 0);

  if (requestedSize === 'single') {
    if (prices.length === 1) {
      return { size: 'single' as const, price: prices[0].price };
    }

    return null;
  }

  if (menuItem.priceType === 'single' && requestedSize === 'small' && prices.length === 1) {
    return { size: 'single' as const, price: prices[0].price };
  }

  return prices.find((entry) => entry.size === requestedSize) ?? null;
};

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const cartItems = Array.isArray(body?.cartItems)
    ? (body.cartItems as CartValidationRequestItem[])
    : [];

  if (cartItems.length === 0) {
    return Response.json({
      items: [],
      canCheckout: false,
      message: 'Cart is empty.',
    });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const normalizedItems = cartItems.map((item) => {
    const id = String(item._id || '');
    const size = normalizeCartSize(item.size);
    const quantity = Math.max(1, Number(item.quantity) || 1);

    return {
      _id: id,
      itemKey: getCartItemKey(id, size),
      requestedSize: size,
      quantity,
      restaurantId: String(item.restaurantId || ''),
      cartPrice: Number(item.price),
    };
  });

  const validIds = normalizedItems
    .map((item) => item._id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  const uniqueIds = Array.from(new Set(validIds)).map((id) => new mongoose.Types.ObjectId(id));

  const menuItems = uniqueIds.length
    ? await MenuItem.find({ _id: { $in: uniqueIds } })
        .select(
          '_id name description image restaurantId isAvailable priceType priceSmall priceMedium priceLarge'
        )
        .lean()
    : [];
  const menuItemById = new Map(
    menuItems.map((menuItem: any) => [menuItem._id.toString(), menuItem])
  );

  const items = normalizedItems.map((cartItem) => {
    if (!mongoose.Types.ObjectId.isValid(cartItem._id) || !cartItem.requestedSize) {
      return {
        ...cartItem,
        status: 'invalid' as const,
        isAvailable: false,
        message: 'This cart item is invalid. Remove it before checkout.',
      };
    }

    const menuItem = menuItemById.get(cartItem._id);
    if (!menuItem) {
      return {
        ...cartItem,
        status: 'deleted' as const,
        isAvailable: false,
        message: 'This menu item was removed. Remove it from your cart.',
      };
    }

    if (menuItem.isAvailable === false) {
      return {
        ...cartItem,
        status: 'unavailable' as const,
        name: menuItem.name,
        image: menuItem.image || null,
        restaurantId: menuItem.restaurantId?.toString?.() || cartItem.restaurantId,
        isAvailable: false,
        message: `${menuItem.name || 'This item'} is currently unavailable.`,
      };
    }

    const sizePrice = getMenuItemSizePrice(menuItem, cartItem.requestedSize);
    if (!sizePrice) {
      return {
        ...cartItem,
        status: 'invalid_size' as const,
        name: menuItem.name,
        image: menuItem.image || null,
        restaurantId: menuItem.restaurantId?.toString?.() || cartItem.restaurantId,
        isAvailable: false,
        message: `${menuItem.name || 'This item'} is not available in that size anymore.`,
      };
    }

    const currentPrice = roundToTwoDecimals(sizePrice.price);
    const cartPrice = Number.isFinite(cartItem.cartPrice)
      ? roundToTwoDecimals(cartItem.cartPrice)
      : null;
    const priceChanged = cartPrice != null && cartPrice !== currentPrice;

    return {
      ...cartItem,
      status: 'valid' as const,
      name: menuItem.name,
      image: menuItem.image || null,
      size: sizePrice.size,
      price: currentPrice,
      restaurantId: menuItem.restaurantId?.toString?.() || cartItem.restaurantId,
      isAvailable: true,
      priceChanged,
      previousPrice: priceChanged ? cartPrice : null,
      message: priceChanged
        ? `${menuItem.name || 'This item'} price changed from $${cartPrice?.toFixed(
            2
          )} to $${currentPrice.toFixed(2)}.`
        : null,
    };
  });

  const blockingItems = items.filter((item) => item.status !== 'valid');
  const priceChangedItems = items.filter((item) => item.status === 'valid' && item.priceChanged);

  return Response.json({
    items,
    canCheckout: blockingItems.length === 0,
    message:
      blockingItems[0]?.message ||
      (priceChangedItems.length > 0
        ? 'Some cart prices changed. Checkout will use the current menu prices.'
        : null),
  });
}
