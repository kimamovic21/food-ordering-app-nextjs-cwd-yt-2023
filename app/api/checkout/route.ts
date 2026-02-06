import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import { calculateLoyaltyStatus } from '@/libs/loyaltyCalculator';
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

export async function POST(req: Request) {
  if (!stripe) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    phone,
    streetAddress,
    postalCode,
    city,
    country,
    cartItems,
    loyaltyDiscount,
    loyaltyDiscountPercentage,
  } = body as {
    phone?: string;
    streetAddress?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    cartItems?: CartItemPayload[];
    loyaltyDiscount?: number;
    loyaltyDiscountPercentage?: number;
  };

  if (!phone || !streetAddress || !postalCode || !city || !country) {
    return Response.json({ error: 'Missing delivery information' }, { status: 400 });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

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
      Boolean(item._id && item.name && item.size && item.quantity > 0 && item.price > 0 && item.restaurantId)
    );

  if (sanitizedItems.length === 0) {
    return Response.json({ error: 'Invalid cart data' }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Single restaurant checkout (enforced by frontend)
  const restaurantId = sanitizedItems[0]?.restaurantId;
  if (!restaurantId) {
    return Response.json({ error: 'No restaurant found in cart' }, { status: 400 });
  }

  // Fetch restaurant data
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return Response.json({ error: `Restaurant ${restaurantId} not found` }, { status: 404 });
  }

  // Verify loyalty discount by checking user's actual order count
  const completedOrderCount = await Order.countDocuments({
    userId: user._id,
    orderStatus: 'completed',
  });

  const loyaltyStatus = calculateLoyaltyStatus(completedOrderCount);
  const verifiedLoyaltyDiscount = loyaltyDiscount || 0;
  const verifiedLoyaltyPercentage = loyaltyDiscountPercentage || 0;

  // Security check: ensure discount doesn't exceed what user should have
  if (verifiedLoyaltyPercentage > loyaltyStatus.discountPercentage) {
    return Response.json({ error: 'Invalid loyalty discount' }, { status: 400 });
  }

  const subtotal = sanitizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (restaurant.tax / 100);
  const deliveryFee = restaurant.courierFee;
  const discountedDeliveryFee = deliveryFee - verifiedLoyaltyDiscount;
  const total = subtotal + tax + discountedDeliveryFee;

  const order = await Order.create({
    userId: user._id,
    email: session.user.email,
    phone,
    streetAddress,
    postalCode,
    city,
    country,
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
    deliveryFee: discountedDeliveryFee,
    loyaltyDiscount: verifiedLoyaltyDiscount,
    loyaltyDiscountPercentage: verifiedLoyaltyPercentage,
    loyaltyTier: loyaltyStatus.currentTier?.name || null,
    total,
    orderPaid: false,
    paid: false,
    orderStatus: 'placed',
  });

  // Add items to Stripe line items
  sanitizedItems.forEach((item) => {
    stripeLineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: `${item.name} (${item.size})`,
        },
      },
    });
  });

  // Add tax
  stripeLineItems.push({
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: Math.max(Math.round(tax * 100), 1),
      product_data: { name: `Tax` },
    },
  });

  // Add delivery fee
  stripeLineItems.push({
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(discountedDeliveryFee * 100),
      product_data: {
        name:
          verifiedLoyaltyDiscount > 0
            ? `Delivery Fee (${verifiedLoyaltyPercentage}% loyalty discount applied)`
            : `Delivery Fee`,
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
      orderId: order._id.toString()
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
