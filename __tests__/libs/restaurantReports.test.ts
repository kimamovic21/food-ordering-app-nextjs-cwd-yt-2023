import { describe, expect, it } from 'vitest';
import {
  buildRestaurantReportSummary,
  getRestaurantReportDateRange,
} from '@/libs/restaurantReports';

describe('restaurant reports', () => {
  it('returns zero values when a period has no activity', () => {
    const range = getRestaurantReportDateRange('daily', '2026-08-09');
    const summary = buildRestaurantReportSummary({
      period: range.period,
      label: range.label,
      start: range.start,
      end: range.end,
      orders: [],
    });

    expect(summary.hasActivity).toBe(false);
    expect(summary.totalOrders).toBe(0);
    expect(summary.netRevenue).toBe(0);
    expect(summary.paymentRate).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.cancellationRate).toBe(0);
    expect(summary.topItems).toEqual([]);
  });

  it('summarizes paid, completed, and canceled restaurant activity', () => {
    const range = getRestaurantReportDateRange('weekly', '2026-08-13');
    const summary = buildRestaurantReportSummary({
      period: range.period,
      label: range.label,
      start: range.start,
      end: range.end,
      orders: [
        {
          _id: 'order-1',
          orderPaid: true,
          paid: true,
          orderStatus: 'completed',
          total: 30,
          taxAmount: 4,
          deliveryFee: 5,
          couponDiscountAmount: 2,
          loyaltyDiscount: 1,
          cartProducts: [{ name: 'Pizza', quantity: 2, price: 10 }],
        },
        {
          _id: 'order-2',
          orderPaid: true,
          paid: true,
          orderStatus: 'canceled',
          total: 15,
          taxAmount: 2,
          deliveryFee: 5,
          cartProducts: [{ name: 'Burger', quantity: 1, price: 10 }],
        },
        {
          _id: 'order-3',
          orderPaid: false,
          paid: false,
          orderStatus: 'placed',
          total: 20,
          cartProducts: [{ name: 'Pizza', quantity: 1, price: 10 }],
        },
      ],
    });

    expect(summary.hasActivity).toBe(true);
    expect(summary.totalOrders).toBe(3);
    expect(summary.paidOrders).toBe(2);
    expect(summary.unpaidOrders).toBe(1);
    expect(summary.completedOrders).toBe(1);
    expect(summary.canceledOrders).toBe(1);
    expect(summary.activeOrders).toBe(1);
    expect(summary.totalRevenue).toBe(45);
    expect(summary.netRevenue).toBe(30);
    expect(summary.canceledValue).toBe(15);
    expect(summary.averageOrderValue).toBe(22.5);
    expect(summary.paymentRate).toBe(66.67);
    expect(summary.completionRate).toBe(33.33);
    expect(summary.cancellationRate).toBe(33.33);
    expect(summary.topItems).toEqual([{ name: 'Pizza', quantity: 2, revenue: 20 }]);
  });
});
