import { createHash } from 'node:crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Coupon } from '@/models/coupon';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
import { calculateLoyaltyStatus } from '@/libs/loyaltyCalculator';
import { notifyOrderPlaced } from '@/libs/notifications';
import { createDeliveryPin } from '@/libs/deliveryPin';
import {
  calculateCouponDiscountAmount,
  getCouponValidationError,
  normalizeCouponCode,
} from '@/libs/coupon';
import { createAuditLog } from '@/libs/auditLog';
import { addMoney, multiplyMoney, roundMoney, subtractMoney } from '@/libs/money';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { normalizePhoneNumberForStorage } from '@/libs/phone';
import {
  createRateLimitKey,
  createRateLimitResponse,
  enforceRateLimit,
  getClientIp,
} from '@/libs/rateLimit';
import type { CartSize, CheckoutCartItemPayload } from '@/types/cart';
import mongoose from 'mongoose';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SK;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
  : null;

export const runtime = 'nodejs';

const DUPLICATE_CHECKOUT_WINDOW_MS = 5 * 60 * 1000;

const roundToTwoDecimals = roundMoney;

const canRecoverFromStripeSessionLookupError = (error: unknown) => {
  const stripeError = error as { code?: string; statusCode?: number };

  return stripeError?.code === 'resource_missing' || stripeError?.statusCode === 404;
};

const getCheckoutOrigin = (req: Request) =>
  req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const normalizeFingerprintText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const normalizeFingerprintCoordinate = (value: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(6)) : null;

const createCheckoutFingerprint = ({
  userId,
  restaurantId,
  verifiedItems,
  delivery,
  pricing,
}: {
  userId: unknown;
  restaurantId: unknown;
  verifiedItems: Array<CheckoutCartItemPayload & { size: CartSize }>;
  delivery: {
    phone: string;
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    specialInstructions: string;
  };
  pricing: {
    subtotal: number;
    taxAmount: number;
    deliveryFee: number;
    loyaltyDiscount: number;
    loyaltyDiscountPercentage: number;
    couponCode: string | null;
    couponDiscountAmount: number;
    total: number;
  };
}) => {
  const payload = {
    userId: String(userId),
    restaurantId: String(restaurantId),
    delivery: {
      phone: normalizeFingerprintText(delivery.phone),
      streetAddress: normalizeFingerprintText(delivery.streetAddress),
      postalCode: normalizeFingerprintText(delivery.postalCode),
      city: normalizeFingerprintText(delivery.city),
      country: normalizeFingerprintText(delivery.country),
      deliveryLatitude: normalizeFingerprintCoordinate(delivery.deliveryLatitude),
      deliveryLongitude: normalizeFingerprintCoordinate(delivery.deliveryLongitude),
      specialInstructions: normalizeFingerprintText(delivery.specialInstructions),
    },
    items: [...verifiedItems]
      .map((item) => ({
        productId: item._id,
        size: item.size,
        quantity: item.quantity,
        price: roundToTwoDecimals(item.price),
      }))
      .sort((firstItem, secondItem) =>
        `${firstItem.productId}:${firstItem.size}`.localeCompare(
          `${secondItem.productId}:${secondItem.size}`
        )
      ),
    pricing: {
      subtotal: roundToTwoDecimals(pricing.subtotal),
      taxAmount: roundToTwoDecimals(pricing.taxAmount),
      deliveryFee: roundToTwoDecimals(pricing.deliveryFee),
      loyaltyDiscount: roundToTwoDecimals(pricing.loyaltyDiscount),
      loyaltyDiscountPercentage: pricing.loyaltyDiscountPercentage,
      couponCode: pricing.couponCode,
      couponDiscountAmount: roundToTwoDecimals(pricing.couponDiscountAmount),
      total: roundToTwoDecimals(pricing.total),
    },
  };

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

const createStripeLineItems = ({
  verifiedItems,
  deliveryFee,
  couponLineDiscountRate,
}: {
  verifiedItems: Array<CheckoutCartItemPayload & { size: CartSize }>;
  deliveryFee: number;
  couponLineDiscountRate: number;
}) => {
  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = verifiedItems.map(
    (item) => {
      const adjustedUnitPrice = multiplyMoney(item.price, 1 - couponLineDiscountRate);

      return {
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.max(0, Math.round(adjustedUnitPrice * 100)),
          product_data: {
            name: `${item.name} (${item.size})`,
          },
        },
      };
    }
  );

  stripeLineItems.push({
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(deliveryFee * 100),
      product_data: {
        name: 'Delivery Fee',
      },
    },
  });

  return stripeLineItems;
};

const createStripeCheckoutSessionForOrder = async ({
  order,
  req,
  email,
  lineItems,
}: {
  order: any;
  req: Request;
  email: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
}) =>
  stripe!.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    metadata: {
      orderId: order._id.toString(),
    },
    line_items: lineItems,
    success_url: `${getCheckoutOrigin(req)}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getCheckoutOrigin(req)}/checkout?status=cancelled`,
  });

const createAndSaveCheckoutSessionResponse = async ({
  order,
  req,
  email,
  lineItems,
  reusedExistingOrder = false,
}: {
  order: any;
  req: Request;
  email: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  reusedExistingOrder?: boolean;
}) => {
  const stripeSession = await createStripeCheckoutSessionForOrder({
    order,
    req,
    email,
    lineItems,
  });

  if (!stripeSession.url) {
    throw new Error('Stripe checkout URL is missing');
  }

  order.stripeSessionId = stripeSession.id;
  await order.save();

  return Response.json({
    url: stripeSession.url,
    orderId: order._id.toString(),
    reusedExistingOrder,
  });
};

const getExistingCheckoutSessionResponse = async ({
  order,
  req,
  email,
  lineItems,
}: {
  order: any;
  req: Request;
  email: string;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
}) => {
  if (!order.stripeSessionId) {
    return createAndSaveCheckoutSessionResponse({
      order,
      req,
      email,
      lineItems,
      reusedExistingOrder: true,
    });
  }

  let stripeSession: Stripe.Checkout.Session;

  try {
    stripeSession = await stripe!.checkout.sessions.retrieve(order.stripeSessionId);
  } catch (error) {
    if (!canRecoverFromStripeSessionLookupError(error)) {
      throw error;
    }

    return createAndSaveCheckoutSessionResponse({
      order,
      req,
      email,
      lineItems,
      reusedExistingOrder: true,
    });
  }

  if (stripeSession.payment_status === 'paid') {
    order.orderPaid = true;
    order.paid = true;
    order.stripeSessionId = stripeSession.id;
    await order.save();

    return Response.json({
      paid: true,
      orderId: order._id.toString(),
      message: 'Payment was already completed. Your order has been updated.',
    });
  }

  if (stripeSession.status === 'open' && stripeSession.url) {
    return Response.json({
      url: stripeSession.url,
      orderId: order._id.toString(),
      reusedExistingOrder: true,
    });
  }

  return createAndSaveCheckoutSessionResponse({
    order,
    req,
    email,
    lineItems,
    reusedExistingOrder: true,
  });
};

const normalizeCartSize = (value: unknown): CartSize | null => {
  const size = String(value || '')
    .trim()
    .toLowerCase();

  if (size === 'single' || size === 'small' || size === 'medium' || size === 'large') {
    return size;
  }

  return null;
};

const normalizeDeliveryCoordinate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
};

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

export async function POST(req: Request) {
  if (!stripe) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    identifier: createRateLimitKey('checkout', getClientIp(req), session.user.email),
    limit: 8,
    namespace: 'checkout',
    window: '5 m',
  });

  if (!rateLimit.success) {
    return createRateLimitResponse(
      rateLimit,
      'Too many checkout attempts. Please wait a little before trying again.'
    );
  }

  const body = await req.json();
  const {
    phone,
    streetAddress,
    postalCode,
    city,
    country,
    deliveryLatitude,
    deliveryLongitude,
    specialInstructions,
    cartItems,
    loyaltyDiscountPercentage,
    couponCode,
  } = body as {
    phone?: string;
    streetAddress?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    deliveryLatitude?: number | null;
    deliveryLongitude?: number | null;
    specialInstructions?: string;
    cartItems?: CheckoutCartItemPayload[];
    loyaltyDiscountPercentage?: number;
    couponCode?: string;
  };

  if (!phone || !streetAddress || !postalCode || !city || !country) {
    return Response.json({ error: 'Missing delivery information' }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumberForStorage(phone);

  if (!normalizedPhone) {
    return Response.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const normalizedSpecialInstructions =
    typeof specialInstructions === 'string' ? specialInstructions.trim().slice(0, 500) : '';

  const sanitizedItems = cartItems
    .map((item) => ({
      _id: String(item._id),
      size: normalizeCartSize(item.size),
      quantity: Number(item.quantity),
      restaurantId: String(item.restaurantId),
    }))
    .filter((item) =>
      Boolean(
        item._id &&
        item.size &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        item.restaurantId
      )
    );

  if (sanitizedItems.length !== cartItems.length || sanitizedItems.length === 0) {
    return Response.json({ error: 'Invalid cart data' }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const activeCustomerOrder = await Order.findOne({
    userId: user._id,
    orderStatus: { $nin: ['completed', 'canceled'] },
    $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
  })
    .select('_id orderStatus')
    .lean();

  if (activeCustomerOrder) {
    return Response.json(
      {
        error:
          'You already have an active order. Please wait until it is completed or canceled before starting a new checkout.',
      },
      { status: 400 }
    );
  }

  // Single restaurant checkout (enforced by frontend)
  const restaurantId = sanitizedItems[0]?.restaurantId;
  if (!restaurantId) {
    return Response.json({ error: 'No restaurant found in cart' }, { status: 400 });
  }

  // Ensure all cart items are from the same restaurant
  const cartHasMultipleRestaurants = sanitizedItems.some(
    (item) => item.restaurantId !== restaurantId
  );
  if (cartHasMultipleRestaurants) {
    return Response.json(
      { error: 'Cart must contain items from one restaurant only' },
      { status: 400 }
    );
  }

  // Fetch restaurant data
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return Response.json({ error: `Restaurant ${restaurantId} not found` }, { status: 404 });
  }

  // Business rule: users cannot place orders from their own restaurant
  if (user.restaurantId?.toString() === restaurant._id.toString()) {
    return Response.json({ error: 'You cannot order from your own restaurant' }, { status: 403 });
  }

  const normalizedDeliveryLatitude = normalizeDeliveryCoordinate(deliveryLatitude);
  const normalizedDeliveryLongitude = normalizeDeliveryCoordinate(deliveryLongitude);
  const hasDeliveryLocation =
    Number.isFinite(normalizedDeliveryLatitude) && Number.isFinite(normalizedDeliveryLongitude);
  const orderingStatus = getRestaurantOrderingStatus({
    restaurant,
    deliveryLatitude: hasDeliveryLocation ? normalizedDeliveryLatitude : null,
    deliveryLongitude: hasDeliveryLocation ? normalizedDeliveryLongitude : null,
  });

  if (orderingStatus.requiresDeliveryLocation) {
    return Response.json(
      {
        error: `Please use your current location so we can confirm this restaurant delivers within ${orderingStatus.deliveryRadiusKm} km.`,
      },
      { status: 400 }
    );
  }

  if (!orderingStatus.isAcceptingOrders) {
    return Response.json(
      {
        error: orderingStatus.reason || 'This restaurant is not accepting orders right now.',
      },
      { status: orderingStatus.isWithinDeliveryRadius === false ? 400 : 409 }
    );
  }

  const activeOrderLimit = Math.min(
    100,
    Math.max(1, Number((restaurant as any).activeOrderLimit) || 10)
  );
  const activeKitchenOrders = await Order.countDocuments({
    restaurantId: restaurant._id,
    orderStatus: { $in: ['placed', 'processing', 'ready'] },
    $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
  });

  if (activeKitchenOrders >= activeOrderLimit) {
    return Response.json(
      {
        error:
          'This restaurant is very busy at the moment. Please wait a little bit and try again.',
      },
      { status: 409 }
    );
  }

  const itemIds = sanitizedItems
    .map((item) => item._id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (itemIds.length !== sanitizedItems.length) {
    return Response.json({ error: 'Cart contains invalid menu items' }, { status: 400 });
  }

  const uniqueItemIds = Array.from(new Set(sanitizedItems.map((item) => item._id))).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const menuItems = await MenuItem.find({ _id: { $in: uniqueItemIds } })
    .select('_id name restaurantId adminId isAvailable priceType priceSmall priceMedium priceLarge')
    .lean();

  if (menuItems.length !== uniqueItemIds.length) {
    return Response.json({ error: 'Some menu items are no longer available' }, { status: 400 });
  }

  const menuItemById = new Map(menuItems.map((menuItem) => [menuItem._id.toString(), menuItem]));
  const verifiedItems: Array<CheckoutCartItemPayload & { size: CartSize }> = [];

  for (const cartItem of sanitizedItems) {
    const menuItem = menuItemById.get(cartItem._id);

    if (!menuItem) {
      return Response.json({ error: 'Some menu items are no longer available' }, { status: 400 });
    }

    if (menuItem.isAvailable === false) {
      return Response.json(
        { error: `${menuItem.name || 'This menu item'} is currently unavailable` },
        { status: 400 }
      );
    }

    const requestedSize = cartItem.size;
    if (!requestedSize) {
      return Response.json({ error: 'Invalid cart data' }, { status: 400 });
    }

    const sizePrice = getMenuItemSizePrice(menuItem, requestedSize);
    if (!sizePrice) {
      return Response.json(
        { error: `${menuItem.name || 'This menu item'} is not available in that size` },
        { status: 400 }
      );
    }

    if (menuItem.restaurantId?.toString() !== restaurant._id.toString()) {
      return Response.json(
        { error: 'Cart item does not belong to the selected restaurant' },
        { status: 400 }
      );
    }

    if (menuItem.adminId?.toString() === user._id.toString()) {
      return Response.json({ error: 'You cannot order your own menu items' }, { status: 403 });
    }

    verifiedItems.push({
      _id: menuItem._id.toString(),
      name: menuItem.name,
      size: sizePrice.size,
      price: roundToTwoDecimals(sizePrice.price),
      quantity: cartItem.quantity,
      restaurantId: menuItem.restaurantId.toString(),
    });
  }

  // Verify loyalty discount by checking user's actual order count
  const completedOrderCount = await Order.countDocuments({
    userId: user._id,
    orderStatus: 'completed',
  });

  const loyaltyStatus = calculateLoyaltyStatus(completedOrderCount);
  const verifiedLoyaltyPercentage = loyaltyDiscountPercentage || 0;

  // Security check: ensure discount doesn't exceed what user should have
  if (verifiedLoyaltyPercentage > loyaltyStatus.discountPercentage) {
    return Response.json({ error: 'Invalid loyalty discount' }, { status: 400 });
  }

  const subtotal = roundToTwoDecimals(
    verifiedItems.reduce((sum, item) => addMoney(sum, multiplyMoney(item.price, item.quantity)), 0)
  );
  const minimumOrderAmount = roundToTwoDecimals(
    Math.min(100, Math.max(1, Number((restaurant as any).minimumOrderAmount) || 10))
  );

  if (subtotal < minimumOrderAmount) {
    return Response.json(
      {
        error: `Minimum order amount for this restaurant is $${minimumOrderAmount.toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  const normalizedCouponCode = couponCode ? normalizeCouponCode(couponCode) : '';
  const coupon = normalizedCouponCode
    ? await Coupon.findOne({
        code: normalizedCouponCode,
        restaurantId: restaurant._id,
      })
    : null;

  let couponDiscountAmount = 0;
  let couponDiscountPercentage = 0;

  if (normalizedCouponCode) {
    if (!coupon) {
      return Response.json({ error: 'Coupon for this restaurant not available' }, { status: 400 });
    }

    const customerCouponUsageCount = await Order.countDocuments({
      userId: user._id,
      couponId: coupon._id,
      orderStatus: { $ne: 'canceled' },
      $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
    });

    const couponValidationError = getCouponValidationError({
      coupon,
      subtotal,
      completedOrderCount,
      customerCouponUsageCount,
    });
    if (couponValidationError) {
      return Response.json({ error: couponValidationError }, { status: 400 });
    }

    couponDiscountAmount = calculateCouponDiscountAmount(subtotal, coupon);
    couponDiscountPercentage = Number(coupon.discountValue) || 0;
  }

  const loyaltyDiscountBase = roundToTwoDecimals(Math.max(subtotal - couponDiscountAmount, 0));
  const verifiedLoyaltyDiscount = multiplyMoney(
    loyaltyDiscountBase,
    verifiedLoyaltyPercentage / 100
  );
  const taxAmount = multiplyMoney(subtotal, restaurant.tax / 100);
  const deliveryFee = roundToTwoDecimals(restaurant.courierFee || 5);
  const estimatedPreparationMinutes = Math.max(
    0,
    Number((restaurant as any).averagePreparationMinutes) || 25
  );
  const estimatedDeliveryMinutes = Math.max(
    0,
    Number((restaurant as any).averageDeliveryMinutes) || 20
  );
  const estimatedTotalMinutes = estimatedPreparationMinutes + estimatedDeliveryMinutes;
  const discountedSubtotal = roundToTwoDecimals(
    Math.max(subtractMoney(subtotal, couponDiscountAmount, verifiedLoyaltyDiscount), 0)
  );
  const total = addMoney(discountedSubtotal, deliveryFee);

  const couponSnapshot = coupon
    ? {
        couponId: coupon._id,
        couponCode: coupon.code,
        couponTitle: coupon.title,
        couponDiscountAmount,
        couponDiscountPercentage,
        couponMinimumOrderAmount: Number(coupon.minimumOrderAmount) || 0,
      }
    : {
        couponId: null,
        couponCode: null,
        couponTitle: null,
        couponDiscountAmount: 0,
        couponDiscountPercentage: 0,
        couponMinimumOrderAmount: 0,
      };

  const foodLineDiscountAmount = addMoney(couponDiscountAmount, verifiedLoyaltyDiscount);
  const couponLineDiscountRate = subtotal > 0 ? foodLineDiscountAmount / subtotal : 0;
  const stripeLineItems = createStripeLineItems({
    verifiedItems,
    deliveryFee,
    couponLineDiscountRate,
  });
  const checkoutFingerprint = createCheckoutFingerprint({
    userId: user._id,
    restaurantId: restaurant._id,
    verifiedItems,
    delivery: {
      phone: normalizedPhone,
      streetAddress,
      postalCode,
      city,
      country,
      deliveryLatitude: hasDeliveryLocation ? normalizedDeliveryLatitude : null,
      deliveryLongitude: hasDeliveryLocation ? normalizedDeliveryLongitude : null,
      specialInstructions: normalizedSpecialInstructions,
    },
    pricing: {
      subtotal,
      taxAmount,
      deliveryFee,
      loyaltyDiscount: verifiedLoyaltyDiscount,
      loyaltyDiscountPercentage: verifiedLoyaltyPercentage,
      couponCode: couponSnapshot.couponCode,
      couponDiscountAmount,
      total,
    },
  });
  const duplicateCheckoutCreatedAfter = new Date(Date.now() - DUPLICATE_CHECKOUT_WINDOW_MS);
  const existingCheckoutOrder = await Order.findOne({
    userId: user._id,
    restaurantId: restaurant._id,
    orderStatus: 'placed',
    checkoutFingerprint,
    createdAt: { $gte: duplicateCheckoutCreatedAfter },
    $nor: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
  }).sort({ createdAt: -1 });

  if (existingCheckoutOrder) {
    return getExistingCheckoutSessionResponse({
      order: existingCheckoutOrder,
      req,
      email: session.user.email,
      lineItems: stripeLineItems,
    });
  }

  const order = await Order.create({
    userId: user._id,
    email: session.user.email,
    phone: normalizedPhone,
    streetAddress,
    postalCode,
    city,
    country,
    deliveryLatitude: hasDeliveryLocation ? normalizedDeliveryLatitude : null,
    deliveryLongitude: hasDeliveryLocation ? normalizedDeliveryLongitude : null,
    specialInstructions: normalizedSpecialInstructions,
    cartProducts: verifiedItems.map((item) => ({
      productId: item._id,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      restaurantId: item.restaurantId,
    })),
    restaurantId: restaurant._id,
    taxPercentage: restaurant.tax,
    taxAmount,
    deliveryFee,
    estimatedPreparationMinutes,
    estimatedDeliveryMinutes,
    estimatedTotalMinutes,
    loyaltyDiscount: verifiedLoyaltyDiscount,
    loyaltyDiscountPercentage: verifiedLoyaltyPercentage,
    loyaltyTier: loyaltyStatus.currentTier?.name || null,
    ...couponSnapshot,
    total,
    orderPaid: false,
    paid: false,
    orderStatus: 'placed',
    checkoutFingerprint,
    deliveryPin: createDeliveryPin(),
  });

  try {
    await notifyOrderPlaced({
      restaurantId: restaurant._id,
      orderId: order._id,
      customerUserId: user._id,
      customerEmail: session.user.email,
      total,
    });
  } catch (notificationError) {
    console.error('Failed to create order placed notifications:', notificationError);
  }

  await createAuditLog({
    actor: user,
    action: 'order.created',
    entityType: 'order',
    entityId: order._id,
    restaurantId: restaurant._id,
    orderId: order._id,
    metadata: {
      total,
      couponCode: couponSnapshot.couponCode,
    },
  });

  const stripeSession = await createStripeCheckoutSessionForOrder({
    order,
    req,
    email: session.user.email,
    lineItems: stripeLineItems,
  });

  if (!stripeSession.url) {
    throw new Error('Stripe checkout URL is missing');
  }

  // Update order with stripe session ID
  order.stripeSessionId = stripeSession.id;
  await order.save();

  return Response.json({ url: stripeSession.url });
}
