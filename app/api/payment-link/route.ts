import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import mongoose from 'mongoose';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SK;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
  : null;

const isPaid = (order: any) => Boolean(order.orderPaid ?? order.paymentStatus ?? order.paid);

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const createCheckoutSessionForOrder = async (order: any, request: Request, email: string) => {
  const origin =
    request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const total = roundToTwoDecimals(Number(order.total) || 0);

  if (total <= 0) {
    throw new Error('Order total is invalid');
  }

  return stripe!.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: order.email || email,
    metadata: {
      orderId: order._id.toString(),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(total * 100),
          product_data: {
            name: `Food order #${order._id.toString().slice(-6)}`,
          },
        },
      },
    ],
    success_url: `${origin}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?status=cancelled`,
  });
};

export async function GET(request: Request) {
  if (!stripe) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.userId?.toString() !== user._id.toString()) {
    return Response.json({ error: 'Unauthorized - Order does not belong to you' }, { status: 403 });
  }

  if (isPaid(order)) {
    return Response.json({ error: 'Order is already paid' }, { status: 400 });
  }

  if (order.orderStatus === 'canceled') {
    return Response.json({ error: 'Canceled orders cannot be paid' }, { status: 400 });
  }

  if (user.restaurantId?.toString() === order.restaurantId?.toString()) {
    return Response.json(
      { error: 'You cannot pay for orders from your own restaurant' },
      { status: 403 }
    );
  }

  if (!order.stripeSessionId) {
    const stripeSession = await createCheckoutSessionForOrder(order, request, session.user.email);
    order.stripeSessionId = stripeSession.id;
    await order.save();

    return Response.json({ url: stripeSession.url });
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (stripeSession.payment_status === 'paid') {
      (order as any).orderPaid = true;
      (order as any).paid = true;
      order.stripeSessionId = stripeSession.id;
      await order.save();

      return Response.json({
        paid: true,
        message: 'Payment was already completed. Your order has been updated.',
      });
    }

    if (stripeSession.status === 'open' && stripeSession.url) {
      return Response.json({ url: stripeSession.url });
    }

    const newStripeSession = await createCheckoutSessionForOrder(
      order,
      request,
      session.user.email
    );
    order.stripeSessionId = newStripeSession.id;
    await order.save();

    return Response.json({ url: newStripeSession.url });
  } catch (error) {
    console.error('Error retrieving or creating Stripe session:', error);
    return Response.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
