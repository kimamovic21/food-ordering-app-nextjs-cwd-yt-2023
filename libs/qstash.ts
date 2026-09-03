import 'server-only';

import { Client } from '@upstash/qstash';
import {
  COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES,
  READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES,
  UNPAID_ORDER_AUTO_CANCEL_MINUTES,
} from '@/libs/orderMaintenanceConfig';

export const QSTASH_ORDER_MAINTENANCE_PATH = '/api/qstash/order-maintenance';

export type QStashOrderMaintenanceReason =
  'unpaid-payment-window' | 'courier-assignment-timeout' | 'ready-without-courier';

type ScheduleOrderMaintenanceInput = {
  orderId: unknown;
  reason: QStashOrderMaintenanceReason;
  delaySeconds: number;
};

let qstashClient: Client | null = null;

const getQStashToken = () => process.env.QSTASH_TOKEN?.trim();

const getAppBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '').trim().replace(/\/$/, '');

const isLocalAppUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname);
  } catch {
    return true;
  }
};

const getQStashClient = (token: string) => {
  if (!qstashClient) {
    qstashClient = new Client({
      token,
      baseUrl: process.env.QSTASH_URL || undefined,
    });
  }

  return qstashClient;
};

export const getQStashOrderMaintenanceUrl = () => {
  const appBaseUrl = getAppBaseUrl();

  return appBaseUrl ? `${appBaseUrl}${QSTASH_ORDER_MAINTENANCE_PATH}` : '';
};

export const canPublishQStashJobs = () => {
  const token = getQStashToken();
  const targetUrl = getQStashOrderMaintenanceUrl();

  return Boolean(token && targetUrl && !isLocalAppUrl(targetUrl));
};

export const scheduleOrderMaintenanceCheck = async ({
  orderId,
  reason,
  delaySeconds,
}: ScheduleOrderMaintenanceInput) => {
  const orderIdText = String(orderId || '');
  const token = getQStashToken();
  const targetUrl = getQStashOrderMaintenanceUrl();

  if (!orderIdText || delaySeconds <= 0 || !token || !targetUrl || isLocalAppUrl(targetUrl)) {
    return { scheduled: false, messageId: null };
  }

  try {
    const result = await getQStashClient(token).publishJSON({
      url: targetUrl,
      body: {
        orderId: orderIdText,
        reason,
      },
      delay: delaySeconds,
      retries: 3,
      method: 'POST',
      label: ['order-maintenance', reason],
    });

    return {
      scheduled: true,
      messageId: 'messageId' in result ? result.messageId : null,
    };
  } catch (error) {
    console.error('Failed to schedule QStash order maintenance check:', error);

    return { scheduled: false, messageId: null };
  }
};

export const scheduleUnpaidOrderAutoCancellationCheck = (orderId: unknown) =>
  scheduleOrderMaintenanceCheck({
    orderId,
    reason: 'unpaid-payment-window',
    delaySeconds: UNPAID_ORDER_AUTO_CANCEL_MINUTES * 60,
  });

export const scheduleReadyWithoutCourierAutoCancellationCheck = (orderId: unknown) =>
  scheduleOrderMaintenanceCheck({
    orderId,
    reason: 'ready-without-courier',
    delaySeconds: READY_WITHOUT_COURIER_AUTO_CANCEL_MINUTES * 60,
  });

export const scheduleCourierAssignmentTimeoutCheck = (orderId: unknown) =>
  scheduleOrderMaintenanceCheck({
    orderId,
    reason: 'courier-assignment-timeout',
    delaySeconds: COURIER_ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES * 60,
  });
