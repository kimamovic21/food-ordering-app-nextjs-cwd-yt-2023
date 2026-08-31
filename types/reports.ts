import type { RestaurantSummary } from '@/types/restaurant';

export type RestaurantReportPeriod = 'daily' | 'weekly' | 'monthly';

export type RestaurantReportSummary = {
  period: RestaurantReportPeriod;
  label: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  canceledOrders: number;
  activeOrders: number;
  totalRevenue: number;
  netRevenue: number;
  canceledValue: number;
  averageOrderValue: number;
  totalTax: number;
  deliveryFees: number;
  couponDiscounts: number;
  loyaltyDiscounts: number;
  paymentRate: number;
  completionRate: number;
  cancellationRate: number;
  itemsSold: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hasActivity: boolean;
};

export type RestaurantReportResponse = {
  restaurant: RestaurantSummary;
  report: RestaurantReportSummary;
  period?: RestaurantReportPeriod;
};
