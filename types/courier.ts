import type { EntityId, ISODateString } from '@/types/common';
import type { UserRole } from '@/types/user';

export type CourierWorkingHour = {
  day: string;
  startTime: string;
  endTime: string;
  isUnavailable?: boolean;
};

export type CourierListItem = {
  _id: EntityId;
  name: string;
  email: string;
  image?: string | null;
  availability: boolean;
  takenOrder?: EntityId | null;
  role: UserRole | string;
  createdAt?: ISODateString;
  distanceToRestaurantKm?: number | null;
  averageRating?: number;
  ratingCount?: number;
};

export type CourierPerformanceSummary = {
  completedDeliveries: number;
  totalAssignments: number;
  acceptedAssignments: number;
  respondedAssignments: number;
  declinedAssignments: number;
  missedAssignments: number;
  lateDeliveries: number;
  totalEarnings: number;
  averageEarning: number;
  averageDeliveryMinutes: number;
  averageResponseMinutes: number;
  assignmentResponseRate: number;
  assignmentAcceptanceRate: number;
  averageRating: number;
  ratingCount: number;
};

export type EarningsChartItem = {
  month: string;
  earnings: number;
  deliveries: number;
};

export type CourierEarningsCourier = {
  _id: EntityId;
  name: string;
  email: string;
  image?: string | null;
  availability: boolean;
  createdAt?: ISODateString;
};

export type CourierEarningsResponse = {
  courier: CourierEarningsCourier;
  earningsChart: EarningsChartItem[];
  summary: CourierPerformanceSummary;
};
