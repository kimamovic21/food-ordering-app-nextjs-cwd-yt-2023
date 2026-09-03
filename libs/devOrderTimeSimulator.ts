import type { OrderPhaseDurationOffsets } from '@/types/order-timeline';

const MAX_DEV_OFFSET_MINUTES = 240;

export const getDevOrderTimeSimulatorStorageKey = (orderId: string) =>
  `dev-order-time-simulator:${orderId}`;

export const sanitizeDevOrderTimeOffsetMinutes = (value: unknown) => {
  const minutes = Math.floor(Number(value) || 0);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.min(MAX_DEV_OFFSET_MINUTES, minutes);
};

export const sanitizeDevOrderTimeOffsets = (value: unknown): OrderPhaseDurationOffsets => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const offsets = value as Record<string, unknown>;

  return {
    waitingForKitchen: sanitizeDevOrderTimeOffsetMinutes(offsets.waitingForKitchen),
    kitchenPreparation: sanitizeDevOrderTimeOffsetMinutes(offsets.kitchenPreparation),
    deliveryTravel: sanitizeDevOrderTimeOffsetMinutes(offsets.deliveryTravel),
    confirmationWait: sanitizeDevOrderTimeOffsetMinutes(offsets.confirmationWait),
    failedDeliveryWait: sanitizeDevOrderTimeOffsetMinutes(offsets.failedDeliveryWait),
    readyWithoutCourierWait: sanitizeDevOrderTimeOffsetMinutes(offsets.readyWithoutCourierWait),
    courierAssignmentWait: sanitizeDevOrderTimeOffsetMinutes(offsets.courierAssignmentWait),
    totalOrderTime: sanitizeDevOrderTimeOffsetMinutes(offsets.totalOrderTime),
  };
};

export const getOrderTimelineTotalOffsetMinutes = (
  offsets: OrderPhaseDurationOffsets | null | undefined
) => {
  if (!offsets) {
    return 0;
  }

  const explicitTotalOffset = sanitizeDevOrderTimeOffsetMinutes(offsets.totalOrderTime);

  if (explicitTotalOffset > 0) {
    return explicitTotalOffset;
  }

  return (
    sanitizeDevOrderTimeOffsetMinutes(offsets.waitingForKitchen) +
    sanitizeDevOrderTimeOffsetMinutes(offsets.kitchenPreparation) +
    sanitizeDevOrderTimeOffsetMinutes(offsets.deliveryTravel) +
    sanitizeDevOrderTimeOffsetMinutes(offsets.confirmationWait)
  );
};

export const getDevFailedDeliveryOffsetMinutes = (offsets: OrderPhaseDurationOffsets) =>
  (offsets.failedDeliveryWait ?? 0) > 0 ? 30 : (offsets.deliveryTravel ?? 0);

export const hasDevOrderTimeOffsets = (offsets: OrderPhaseDurationOffsets) =>
  Object.values(offsets).some((value) => sanitizeDevOrderTimeOffsetMinutes(value) > 0);

export const getDevOrderTimeOffsetsFromStorage = (orderId: string): OrderPhaseDurationOffsets => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(getDevOrderTimeSimulatorStorageKey(orderId));

    return sanitizeDevOrderTimeOffsets(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return {};
  }
};
