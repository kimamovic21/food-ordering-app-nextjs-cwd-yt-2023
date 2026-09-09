import mongoose from 'mongoose';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import type { CartSize, CartValidationRequestItem, CartValidationResponse } from '@/types/cart';

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

const normalizeCoordinate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const toRestaurantStatus = (orderingStatus: ReturnType<typeof getRestaurantOrderingStatus>) => {
  if (orderingStatus.isPaused) return 'paused' as const;
  if (!orderingStatus.isOpen) return 'closed' as const;
  if (orderingStatus.isClosingSoonForCheckout) return 'closing_soon' as const;
  if (orderingStatus.isWithinDeliveryRadius === false) return 'outside_delivery_radius' as const;
  if (orderingStatus.requiresDeliveryLocation) return 'missing_delivery_location' as const;
  return 'valid' as const;
};

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
  const requestedRestaurantIds = new Set(
    normalizedItems.map((item) => item.restaurantId).filter(Boolean)
  );
  const currentRestaurantIds = new Set(
    items
      .filter((item) => item.status === 'valid' && item.restaurantId)
      .map((item) => String(item.restaurantId))
  );

  let restaurantValidation: CartValidationResponse['restaurant'] = null;

  if (blockingItems.length === 0) {
    if (requestedRestaurantIds.size > 1 || currentRestaurantIds.size > 1) {
      restaurantValidation = {
        status: 'multiple_restaurants',
        canCheckout: false,
        message: 'Cart must contain items from one restaurant only.',
      };
    } else {
      const requestedRestaurantId = Array.from(requestedRestaurantIds)[0] || null;
      const currentRestaurantId = Array.from(currentRestaurantIds)[0] || requestedRestaurantId;

      if (
        requestedRestaurantId &&
        currentRestaurantId &&
        requestedRestaurantId !== currentRestaurantId
      ) {
        restaurantValidation = {
          restaurantId: currentRestaurantId,
          status: 'restaurant_mismatch',
          canCheckout: false,
          message: 'Cart restaurant data changed. Please refresh your cart before checkout.',
        };
      } else if (!currentRestaurantId || !mongoose.Types.ObjectId.isValid(currentRestaurantId)) {
        restaurantValidation = {
          status: 'missing',
          canCheckout: false,
          message: 'Cart restaurant is missing. Please refresh your cart before checkout.',
        };
      } else {
        const restaurant = await Restaurant.findById(currentRestaurantId)
          .select(
            'name workingHours blockedDates deliveryRadiusKm isPaused pauseReason activeOrderLimit minimumOrderAmount latitude longitude'
          )
          .lean();

        if (!restaurant) {
          restaurantValidation = {
            restaurantId: currentRestaurantId,
            status: 'missing',
            canCheckout: false,
            message: 'This restaurant is no longer available.',
          };
        } else {
          const deliveryLatitude = normalizeCoordinate(body?.deliveryLatitude);
          const deliveryLongitude = normalizeCoordinate(body?.deliveryLongitude);
          const orderingStatus = getRestaurantOrderingStatus({
            restaurant,
            deliveryLatitude,
            deliveryLongitude,
          });
          const activeOrderLimit = Math.min(
            100,
            Math.max(1, Number((restaurant as any).activeOrderLimit) || 10)
          );
          const activeKitchenOrders = await Order.countDocuments({
            restaurantId: (restaurant as any)._id,
            orderStatus: { $in: ['placed', 'processing', 'ready'] },
            $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
          });
          const isBusy = activeKitchenOrders >= activeOrderLimit;
          const subtotal = roundToTwoDecimals(
            items.reduce((sum, item) => {
              if (item.status !== 'valid' || typeof item.price !== 'number') {
                return sum;
              }

              return sum + item.price * Math.max(1, Number(item.quantity) || 1);
            }, 0)
          );
          const minimumOrderAmount = roundToTwoDecimals(
            Math.min(100, Math.max(1, Number((restaurant as any).minimumOrderAmount) || 10))
          );

          const baseRestaurantStatus = toRestaurantStatus(orderingStatus);
          const restaurantStatus = isBusy
            ? ('busy' as const)
            : baseRestaurantStatus !== 'valid'
              ? baseRestaurantStatus
              : subtotal < minimumOrderAmount
                ? ('below_minimum' as const)
                : ('valid' as const);
          const restaurantMessage =
            restaurantStatus === 'busy'
              ? 'This restaurant is very busy at the moment. Please wait a little bit and try again.'
              : restaurantStatus === 'below_minimum'
                ? `Minimum order amount for this restaurant is $${minimumOrderAmount.toFixed(2)}.`
                : orderingStatus.requiresDeliveryLocation
                  ? `Please use your current location so we can confirm this restaurant delivers within ${orderingStatus.deliveryRadiusKm} km.`
                  : orderingStatus.reason;

          restaurantValidation = {
            restaurantId: String((restaurant as any)._id),
            restaurantName: String((restaurant as any).name || 'The restaurant'),
            status: restaurantStatus,
            canCheckout: restaurantStatus === 'valid',
            message: restaurantMessage,
            subtotal,
            minimumOrderAmount,
            deliveryRadiusKm: orderingStatus.deliveryRadiusKm,
            distanceKm: orderingStatus.distanceKm,
            isOpen: orderingStatus.isOpen,
            isPaused: orderingStatus.isPaused,
            isBusy,
            isAcceptingOrders: orderingStatus.isAcceptingOrders && !isBusy,
          };
        }
      }
    }
  }

  const restaurantBlocksCheckout = restaurantValidation ? !restaurantValidation.canCheckout : false;

  return Response.json({
    items,
    restaurant: restaurantValidation,
    canCheckout: blockingItems.length === 0 && !restaurantBlocksCheckout,
    message:
      blockingItems[0]?.message ||
      restaurantValidation?.message ||
      (priceChangedItems.length > 0
        ? 'Some cart prices changed. Checkout will use the current menu prices.'
        : null),
  });
}
