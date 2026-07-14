import type { OrderPhaseDurationOffsets } from '@/components/shared/OrderPhaseTimeline';
import { sanitizeDevOrderTimeOffsets } from '@/libs/devOrderTimeSimulator';

type DevOrderTimeSimulatorGlobal = typeof globalThis & {
  __devOrderTimeSimulatorOffsets?: Map<string, OrderPhaseDurationOffsets>;
};

const getStore = () => {
  const globalStore = globalThis as DevOrderTimeSimulatorGlobal;

  if (!globalStore.__devOrderTimeSimulatorOffsets) {
    globalStore.__devOrderTimeSimulatorOffsets = new Map();
  }

  return globalStore.__devOrderTimeSimulatorOffsets;
};

export const getDevOrderTimeSimulatorOffsets = (orderId: string) => getStore().get(orderId) || {};

export const setDevOrderTimeSimulatorOffsets = (
  orderId: string,
  offsets: OrderPhaseDurationOffsets
) => {
  const sanitizedOffsets = sanitizeDevOrderTimeOffsets(offsets);

  getStore().set(orderId, sanitizedOffsets);

  return sanitizedOffsets;
};

export const clearDevOrderTimeSimulatorOffsets = (orderId: string) => {
  getStore().delete(orderId);
};
