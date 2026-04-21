import { headers } from 'next/headers';
import { Order } from '@/models/order';
import { MenuItem } from '@/models/menuItem';
import { Restaurant } from '@/models/restaurant';
import { notifyRestaurantAdminsAboutPaidOrder } from '@/libs/notifications';
import { sendPurchaseReceiptEmail } from './sendPurchaseReceiptEmail';
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
        const wasPaid = Boolean((order as any).orderPaid ?? (order as any).paid);
        (order as any).orderPaid = true;
        (order as any).paid = true; // keep legacy flag in sync
        if (!(order as any).orderStatus) {
          (order as any).orderStatus = 'pending';
        }
        order.stripeSessionId = session.id;
        await order.save();

        if (!wasPaid) {
          try {
            await notifyRestaurantAdminsAboutPaidOrder({
              restaurantId: order.restaurantId,
              orderId: order._id,
              customerEmail: order.email,
              total: Number((order as any).total) || 0,
            });
          } catch (notificationError) {
            console.error('Failed to create admin notification for paid order:', notificationError);
          }
        }

        const shouldSendReceipt = !wasPaid || !(order as any).receiptEmailSentAt;

        if (shouldSendReceipt) {
          const restaurant = await Restaurant.findById(order.restaurantId)
            .select('name contact email street city postalCode country')
            .lean();

          const productIds = ((order as any).cartProducts || [])
            .map((item: any) => String(item.productId))
            .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
            .map((id: string) => new mongoose.Types.ObjectId(id));

          const menuItems = await MenuItem.find({ _id: { $in: productIds } })
            .select('_id image')
            .lean();

          const imageMap = new Map(menuItems.map((item) => [item._id.toString(), item.image]));
          const items = ((order as any).cartProducts || []).map((item: any) => ({
            name: item.name,
            size: item.size,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            image: imageMap.get(String(item.productId)) || null,
          }));

          const emailResult = await sendPurchaseReceiptEmail({
            orderId: order._id.toString(),
            customerEmail: order.email,
            purchasedOn: order.updatedAt,
            restaurant: restaurant
              ? {
                  name: restaurant.name,
                  contact: restaurant.contact || null,
                  email: restaurant.email || null,
                  street: restaurant.street || null,
                  city: restaurant.city || null,
                  postalCode: restaurant.postalCode || null,
                  country: restaurant.country || null,
                }
              : null,
            items,
            taxAmount: Number((order as any).taxAmount) || 0,
            deliveryFee: Number((order as any).deliveryFee) || 0,
            total: Number((order as any).total) || 0,
          });

          if (emailResult.sent) {
            (order as any).receiptEmailSentAt = new Date();
            await order.save();
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
