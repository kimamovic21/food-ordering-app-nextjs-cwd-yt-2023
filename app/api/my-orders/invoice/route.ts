import { authOptions } from '@/libs/authOptions';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import PurchaseReceiptPdfDocument from '@/components/shared/PurchaseReceiptPdfDocument';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { pdf } from '@react-pdf/renderer';
import React from 'react';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const order = await Order.findOne({ userId: user._id, stripeSessionId: sessionId }).lean();

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const restaurant = await Restaurant.findById(order.restaurantId)
    .select('name contact email street city postalCode country')
    .lean();

  const productIds = (order.cartProducts || [])
    .map((item: any) => String(item.productId))
    .filter((productId: string) => mongoose.Types.ObjectId.isValid(productId))
    .map((productId: string) => new mongoose.Types.ObjectId(productId));

  const menuItems = await MenuItem.find({ _id: { $in: productIds } })
    .select('_id image')
    .lean();

  const imageMap = new Map(menuItems.map((item) => [item._id.toString(), item.image]));

  const receiptItems = (order.cartProducts || []).map((item: any) => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;

    return {
      ...item,
      quantity,
      price,
      image: imageMap.get(String(item.productId)) || null,
      lineTotal: price * quantity,
    };
  });

  const doc = React.createElement(PurchaseReceiptPdfDocument, {
    orderId: String(order._id),
    customerEmail: String(order.email || session.user.email),
    purchasedOn: order.updatedAt || order.createdAt,
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
    items: receiptItems.map((item: any) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
    taxAmount: Number(order.taxAmount) || 0,
    deliveryFee: Number(order.deliveryFee) || 0,
    total: Number(order.total) || 0,
  });

  const pdfBuffer = await pdf(doc).toBuffer();
  const fileName = `invoice-${String(order._id)}.pdf`;

  return new Response(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
