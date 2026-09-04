import 'server-only';
import type { HydratedDocument } from 'mongoose';
import { createAuditLog } from '@/libs/auditLog';
import { notifyOrderAutoCanceled } from '@/libs/notifications';
import {
  READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES,
  UNPAID_ORDER_AUTO_CANCEL_MINUTES,
} from '@/libs/orderMaintenanceConfig';
import { notifyWaitingUsersIfRestaurantCanAcceptOrders } from '@/libs/restaurantAvailabilityRequests';
import { expireOpenStripeCheckoutSession } from '@/libs/stripeCheckoutSession';
import type { OrderPhaseDurationOffsets } from '@/types/order-timeline';

export { READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES, UNPAID_ORDER_AUTO_CANCEL_MINUTES };

type OrderDocument = HydratedDocument<any>;

const getElapsedMinutes = (date: Date | string | null | undefined, offsetMinutes = 0) => {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return 0;

  return Math.floor((Date.now() - timestamp) / 60000) + Math.max(0, offsetMinutes);
};

const isOrderPaid = (order: OrderDocument) =>
  Boolean(order.orderPaid || order.paymentStatus || order.paid);

const markOrderCanceledBySystem = async (order: OrderDocument, reason: string) => {
  const now = new Date();
  const wasPaidBeforeCancellation = isOrderPaid(order);

  order.orderStatus = 'canceled';
  order.orderPaid = false;
  order.paid = false;
  order.paymentStatus = false;
  order.courierAssignmentStatus = null;
  order.courierId = null;
  order.canceledBy = 'system';
  order.canceledAt = now;
  order.cancellationReason = reason;

  const stripeCheckoutExpiration = wasPaidBeforeCancellation
    ? null
    : await expireOpenStripeCheckoutSession(order.stripeSessionId);

  await order.save();

  await createAuditLog({
    actor: { email: 'system', role: 'system' },
    action: 'order.auto_canceled',
    entityType: 'order',
    entityId: order._id,
    restaurantId: order.restaurantId,
    orderId: order._id,
    metadata: {
      reason,
      ...(stripeCheckoutExpiration
        ? {
            stripeCheckoutSessionExpired: stripeCheckoutExpiration.expired,
            stripeCheckoutSessionExpirationReason: stripeCheckoutExpiration.reason,
            stripeCheckoutSessionId: stripeCheckoutExpiration.sessionId,
          }
        : {}),
    },
  });

  try {
    await notifyOrderAutoCanceled({
      userId: order.userId || null,
      restaurantId: order.restaurantId || null,
      orderId: order._id,
      reason,
    });
  } catch (notificationError) {
    console.error('Failed to create auto-cancel notifications:', notificationError);
  }

  await notifyWaitingUsersIfRestaurantCanAcceptOrders(order.restaurantId);

  return order;
};

export const applyOrderAutoCancellation = async (
  order: OrderDocument,
  offsets: OrderPhaseDurationOffsets = {}
) => {
  if (!order || order.orderStatus === 'canceled' || order.orderStatus === 'completed') {
    return { order, canceled: false, reason: '' };
  }

  const isPaid = isOrderPaid(order);

  if (!isPaid && order.orderStatus === 'placed') {
    const elapsedMinutes = getElapsedMinutes(order.createdAt);

    if (elapsedMinutes >= UNPAID_ORDER_AUTO_CANCEL_MINUTES) {
      const reason = `Order was automatically canceled because payment was not completed within ${UNPAID_ORDER_AUTO_CANCEL_MINUTES} minutes.`;

      return {
        order: await markOrderCanceledBySystem(order, reason),
        canceled: true,
        reason,
      };
    }
  }

  if (order.orderStatus === 'ready' && !order.courierId && order.readyAt) {
    const elapsedMinutes = getElapsedMinutes(order.readyAt, offsets.readyWithoutCourierWait ?? 0);

    if (elapsedMinutes >= READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES) {
      const reason = `Order was automatically canceled because no courier accepted it within ${READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES} minutes after it was ready.`;

      return {
        order: await markOrderCanceledBySystem(order, reason),
        canceled: true,
        reason,
      };
    }
  }

  return { order, canceled: false, reason: '' };
};

export const isReadyWithoutCourierLate = (
  order: {
    orderStatus?: string | null;
    readyAt?: Date | string | null;
    courierId?: unknown;
  },
  thresholdMinutes = 15
) =>
  order.orderStatus === 'ready' &&
  !order.courierId &&
  getElapsedMinutes(order.readyAt) >= thresholdMinutes;
