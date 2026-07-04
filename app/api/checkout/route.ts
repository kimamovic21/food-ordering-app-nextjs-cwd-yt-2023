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
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import {
  createRateLimitKey,
  createRateLimitResponse,
  enforceRateLimit,
  getClientIp,
} from '@/libs/rateLimit';
import mongoose from 'mongoose';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SK;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
  : null;

type CartItemPayload = {
  _id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  restaurantId: string;
};

export const runtime = 'nodejs';

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

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
    cartItems?: CartItemPayload[];
    loyaltyDiscountPercentage?: number;
    couponCode?: string;
  };

  if (!phone || !streetAddress || !postalCode || !city || !country) {
    return Response.json({ error: 'Missing delivery information' }, { status: 400 });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const normalizedSpecialInstructions =
    typeof specialInstructions === 'string' ? specialInstructions.trim().slice(0, 500) : '';

  const sanitizedItems = cartItems
    .map((item) => ({
      _id: String(item._id),
      name: item.name,
      size: item.size,
      price: Number(item.price),
      quantity: Number(item.quantity),
      restaurantId: String(item.restaurantId),
    }))
    .filter((item) =>
      Boolean(
        item._id &&
        item.name &&
        item.size &&
        item.quantity > 0 &&
        item.price > 0 &&
        item.restaurantId
      )
    );

  if (sanitizedItems.length === 0) {
    return Response.json({ error: 'Invalid cart data' }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const pendingDeliveryConfirmation = await Order.findOne({
    userId: user._id,
    orderPaid: true,
    orderStatus: 'delivered',
  })
    .select('_id')
    .lean();

  if (pendingDeliveryConfirmation) {
    return Response.json(
      {
        error: 'Please confirm your previous delivered order before starting a new checkout.',
      },
      { status: 400 }
    );
  }

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

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

  const normalizedDeliveryLatitude =
    deliveryLatitude === null || deliveryLatitude === undefined ? null : Number(deliveryLatitude);
  const normalizedDeliveryLongitude =
    deliveryLongitude === null || deliveryLongitude === undefined
      ? null
      : Number(deliveryLongitude);
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

  const menuItems = await MenuItem.find({ _id: { $in: itemIds } })
    .select('_id name restaurantId adminId isAvailable')
    .lean();

  if (menuItems.length !== itemIds.length) {
    return Response.json({ error: 'Some menu items are no longer available' }, { status: 400 });
  }

  const menuItemById = new Map(menuItems.map((menuItem) => [menuItem._id.toString(), menuItem]));

  for (const cartItem of sanitizedItems) {
    const menuItem = menuItemById.get(cartItem._id);

    if (!menuItem) {
      return Response.json({ error: 'Some menu items are no longer available' }, { status: 400 });
    }

    if (menuItem.isAvailable === false) {
      return Response.json(
        { error: `${cartItem.name || menuItem.name || 'This menu item'} is currently unavailable` },
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
    sanitizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
  const verifiedLoyaltyDiscount = roundToTwoDecimals(
    (loyaltyDiscountBase * verifiedLoyaltyPercentage) / 100
  );
  const taxAmount = roundToTwoDecimals(subtotal * (restaurant.tax / 100));
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
    Math.max(subtotal - couponDiscountAmount - verifiedLoyaltyDiscount, 0)
  );
  const total = roundToTwoDecimals(discountedSubtotal + deliveryFee);

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

  const foodLineDiscountAmount = couponDiscountAmount + verifiedLoyaltyDiscount;
  const couponLineDiscountRate = subtotal > 0 ? foodLineDiscountAmount / subtotal : 0;

  const order = await Order.create({
    userId: user._id,
    email: session.user.email,
    phone,
    streetAddress,
    postalCode,
    city,
    country,
    deliveryLatitude: hasDeliveryLocation ? normalizedDeliveryLatitude : null,
    deliveryLongitude: hasDeliveryLocation ? normalizedDeliveryLongitude : null,
    deliveryDistanceKm:
      typeof orderingStatus.distanceKm === 'number'
        ? roundToTwoDecimals(orderingStatus.distanceKm)
        : null,
    specialInstructions: normalizedSpecialInstructions,
    cartProducts: sanitizedItems.map((item) => ({
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
      deliveryDistanceKm: orderingStatus.distanceKm,
    },
  });

  // Add items to Stripe line items
  sanitizedItems.forEach((item) => {
    const adjustedUnitPrice = roundToTwoDecimals(item.price * (1 - couponLineDiscountRate));

    stripeLineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.max(0, Math.round(adjustedUnitPrice * 100)),
        product_data: {
          name: `${item.name} (${item.size})`,
        },
      },
    });
  });

  // Add delivery fee
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

  const origin =
    req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: session.user.email,
    metadata: {
      orderId: order._id.toString(),
    },
    line_items: stripeLineItems,
    success_url: `${origin}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?status=cancelled`,
  });

  // Update order with stripe session ID
  order.stripeSessionId = stripeSession.id;
  await order.save();

  return Response.json({ url: stripeSession.url });
}
