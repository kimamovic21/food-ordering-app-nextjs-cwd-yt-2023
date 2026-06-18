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

  const order = await Order.findById(orderId).lean();

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
    return Response.json({ error: 'No payment session found for this order' }, { status: 404 });
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (stripeSession.status === 'expired') {
      return Response.json({ error: 'Payment session has expired' }, { status: 400 });
    }

    return Response.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return Response.json({ error: 'Failed to retrieve payment session' }, { status: 500 });
  }
}
