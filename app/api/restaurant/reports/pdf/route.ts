import React from 'react';
import mongoose from 'mongoose';
import { pdf } from '@react-pdf/renderer';
import { getServerSession } from 'next-auth/next';
import RestaurantReportPdfDocument from '@/components/shared/RestaurantReportPdfDocument';
import { authOptions } from '@/libs/authOptions';
import {
  buildRestaurantReportSummary,
  getRestaurantReportDateRange,
} from '@/libs/restaurantReports';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user || user.role !== 'admin' || !user.restaurantId) {
    return Response.json({ error: 'Restaurant admin access required' }, { status: 403 });
  }

  const restaurant = await Restaurant.findById(user.restaurantId)
    .select('_id name street city postalCode country email contact')
    .lean();
  if (!restaurant) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const range = getRestaurantReportDateRange(searchParams.get('period'), searchParams.get('date'));

  const orders = await Order.find({
    restaurantId: restaurant._id,
    createdAt: {
      $gte: range.start,
      $lte: range.end,
    },
  })
    .select(
      '_id orderStatus orderPaid paid total taxAmount deliveryFee couponDiscountAmount loyaltyDiscount cartProducts createdAt'
    )
    .lean();

  const report = buildRestaurantReportSummary({
    period: range.period,
    label: range.label,
    start: range.start,
    end: range.end,
    orders,
  });

  if (!report.hasActivity) {
    return Response.json({ error: 'No report activity for this period' }, { status: 400 });
  }

  const doc = React.createElement(RestaurantReportPdfDocument, {
    restaurant: {
      name: restaurant.name,
      street: restaurant.street,
      city: restaurant.city,
      postalCode: restaurant.postalCode,
      country: restaurant.country,
      email: restaurant.email,
      contact: restaurant.contact,
    },
    report,
    generatedAt: new Date(),
  });

  const pdfBuffer = await pdf(doc as any).toBuffer();
  const fileName = `restaurant-${range.period}-report-${range.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
