import { headers } from 'next/headers';
import { Order } from '@/models/order';
import mongoose from 'mongoose';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SK;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
  : null;

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!stripe) {
    return new Response('Stripe is not configured', { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Webhook secret is not set', { status: 500 });
  }

  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  if (!signature) {
    return new Response('Missing Stripe signature', { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await mongoose.connect(process.env.MONGODB_URL as string);
      const order = await Order.findById(orderId);
      if (order) {
        (order as any).orderPaid = true;
        (order as any).paid = true; // keep legacy flag in sync
        if (!(order as any).orderStatus) {
          (order as any).orderStatus = 'pending';
        }
        order.stripeSessionId = session.id;
        await order.save();
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
