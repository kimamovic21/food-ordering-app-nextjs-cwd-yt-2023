import type { HydratedDocument } from 'mongoose';

export type FinalCourierAssignmentHistoryStatus = 'accepted' | 'declined' | 'expired';

type AssignmentHistoryInput = {
  courierId: unknown;
  status: FinalCourierAssignmentHistoryStatus;
  assignedAt?: Date | string | null;
  respondedAt?: Date | string | null;
};

const getIdText = (value: any) => value?._id?.toString?.() || value?.toString?.() || '';

const getDate = (value: Date | string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const addCourierAssignmentHistoryEntry = (
  order: HydratedDocument<any>,
  { courierId, status, assignedAt, respondedAt }: AssignmentHistoryInput
) => {
  const courierIdText = getIdText(courierId);

  if (!courierIdText) {
    return;
  }

  const respondedDate = getDate(respondedAt) || new Date();
  const assignedDate = getDate(assignedAt) || respondedDate;
  const history = Array.isArray(order.courierAssignmentHistory)
    ? order.courierAssignmentHistory
    : [];
  const existingAttemptIndex = history.findIndex((entry: any) => {
    const sameCourier = getIdText(entry.courierId) === courierIdText;
    const entryAssignedAt = getDate(entry.assignedAt)?.getTime();

    return sameCourier && entryAssignedAt === assignedDate.getTime();
  });

  if (existingAttemptIndex >= 0) {
    history[existingAttemptIndex] = {
      ...history[existingAttemptIndex],
      courierId,
      status,
      assignedAt: assignedDate,
      respondedAt: respondedDate,
    };
    order.courierAssignmentHistory = history;
    return;
  }

  history.push({
    courierId,
    status,
    assignedAt: assignedDate,
    respondedAt: respondedDate,
  });
  order.courierAssignmentHistory = history;
};
