import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import mongoose from 'mongoose';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import type { QStashOrderMaintenanceReason } from '@/libs/qstash';
import { Order } from '@/models/order';

export const runtime = 'nodejs';

const orderMaintenanceReasons: QStashOrderMaintenanceReason[] = [
  'unpaid-payment-window',
  'courier-assignment-timeout',
  'ready-without-courier',
];

const isOrderMaintenanceReason = (value: unknown): value is QStashOrderMaintenanceReason =>
  orderMaintenanceReasons.includes(value as QStashOrderMaintenanceReason);

export const handleQStashOrderMaintenance = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '');
  const reason = body?.reason;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  if (!isOrderMaintenanceReason(reason)) {
    return Response.json({ error: 'Invalid maintenance reason' }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGODB_URL as string);

  const order = await Order.findById(orderId);
  if (!order) {
    return Response.json({
      ok: true,
      orderId,
      canceled: false,
      skipped: 'order_not_found',
    });
  }

  if (reason === 'courier-assignment-timeout') {
    const result = await applyCourierAssignmentTimeout(order);

    return Response.json({
      ok: true,
      orderId,
      reason,
      assignmentExpired: result.expired,
      expirationReason: result.reason || null,
      orderStatus: result.order?.orderStatus || null,
      courierAssignmentStatus: result.order?.courierAssignmentStatus || null,
    });
  }

  if (reason === 'ready-without-courier') {
    await applyCourierAssignmentTimeout(order);
  }

  const result = await applyOrderAutoCancellation(order);

  return Response.json({
    ok: true,
    orderId,
    reason,
    canceled: result.canceled,
    cancellationReason: result.reason || null,
    orderStatus: result.order?.orderStatus || null,
  });
};

export const POST = verifySignatureAppRouter(handleQStashOrderMaintenance);
