import 'server-only';

import type { HydratedDocument } from 'mongoose';
import { addCourierAssignmentHistoryEntry } from '@/libs/courierAssignmentHistory';
import { createAuditLog } from '@/libs/auditLog';
import {
  notifyCourierAboutAssignmentExpired,
  notifyRestaurantAdminsAboutCourierAssignmentTimeout,
} from '@/libs/notifications';
import { COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES } from '@/libs/orderMaintenanceConfig';
import { User } from '@/models/user';
import type { OrderPhaseDurationOffsets } from '@/types/order-timeline';

type OrderDocument = HydratedDocument<any>;

export { COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES };

const getIdValue = (value: any) => value?._id || value;

const getIdText = (value: any) => {
  const idValue = getIdValue(value);

  return idValue?.toString?.() || '';
};

const getElapsedMinutes = (date: Date | string | null | undefined, offsetMinutes = 0) => {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return 0;

  return Math.floor((Date.now() - timestamp) / 60000) + Math.max(0, offsetMinutes);
};

export const getCourierAssignmentElapsedMinutes = (
  order: {
    courierAssignedAt?: Date | string | null;
  },
  offsets: OrderPhaseDurationOffsets = {}
) => getElapsedMinutes(order.courierAssignedAt, offsets.courierAssignmentWait ?? 0);

export const applyCourierAssignmentTimeout = async (
  order: OrderDocument,
  offsets: OrderPhaseDurationOffsets = {}
) => {
  if (
    !order ||
    order.orderStatus !== 'ready' ||
    order.courierAssignmentStatus !== 'pending' ||
    !order.courierId ||
    !order.courierAssignedAt
  ) {
    return { order, expired: false, reason: '' };
  }

  const elapsedMinutes = getCourierAssignmentElapsedMinutes(order, offsets);

  if (elapsedMinutes < COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES) {
    return { order, expired: false, reason: '' };
  }

  const previousCourierId = getIdValue(order.courierId);
  const previousCourierIdText = getIdText(previousCourierId);
  const reason = `Courier assignment expired because the courier did not accept or decline within ${COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES} minutes.`;
  const now = new Date();
  let courierName = 'Courier';

  if (previousCourierIdText) {
    const courier = await User.findById(previousCourierId);

    if (courier) {
      courierName = courier.name || courierName;

      if (courier.takenOrder?.toString() === order._id.toString()) {
        courier.takenOrder = null;
        await courier.save();
      }
    }
  }

  order.courierAssignmentStatus = 'expired';
  order.courierAssignmentExpiredAt = now;
  order.courierAssignmentExpiredCourierId = previousCourierId;
  addCourierAssignmentHistoryEntry(order, {
    courierId: previousCourierId,
    status: 'expired',
    assignedAt: order.courierAssignedAt,
    respondedAt: now,
  });
  order.courierId = null;
  order.courierAcceptedAt = null;
  order.restaurantHandedToCourierAt = null;
  order.courierPickedUpAt = null;

  await order.save();

  await createAuditLog({
    actor: { email: 'system', role: 'system' },
    action: 'order.courier_assignment_expired',
    entityType: 'order',
    entityId: order._id,
    restaurantId: order.restaurantId,
    orderId: order._id,
    metadata: {
      courierId: previousCourierIdText || null,
      reason,
      timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
    },
  });

  try {
    await Promise.all([
      order.restaurantId
        ? notifyRestaurantAdminsAboutCourierAssignmentTimeout({
            restaurantId: order.restaurantId,
            orderId: order._id,
            courierName,
            courierId: previousCourierIdText || null,
            timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
          })
        : null,
      previousCourierIdText
        ? notifyCourierAboutAssignmentExpired({
            courierId: previousCourierId,
            orderId: order._id,
            timeoutMinutes: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
          })
        : null,
    ]);
  } catch (notificationError) {
    console.error('Failed to create courier assignment timeout notifications:', notificationError);
  }

  return { order, expired: true, reason };
};
