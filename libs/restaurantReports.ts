import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type RestaurantReportPeriod = 'daily' | 'weekly' | 'monthly';

type ReportOrder = {
  _id: unknown;
  orderStatus?: string | null;
  orderPaid?: boolean | null;
  paid?: boolean | null;
  total?: number | null;
  taxAmount?: number | null;
  deliveryFee?: number | null;
  couponDiscountAmount?: number | null;
  loyaltyDiscount?: number | null;
  cartProducts?: Array<{
    name?: string | null;
    quantity?: number | null;
    price?: number | null;
  }>;
};

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

export const REPORT_PERIODS: RestaurantReportPeriod[] = ['daily', 'weekly', 'monthly'];

export const normalizeReportPeriod = (period?: string | null): RestaurantReportPeriod =>
  REPORT_PERIODS.includes(period as RestaurantReportPeriod)
    ? (period as RestaurantReportPeriod)
    : 'daily';

const parseReportDate = (value?: string | null) => {
  if (!value) {
    return new Date();
  }

  const parsed = parseISO(value);

  return isValid(parsed) ? parsed : new Date();
};

export const getRestaurantReportDateRange = (
  periodInput?: string | null,
  dateInput?: string | null
) => {
  const period = normalizeReportPeriod(periodInput);
  const date = parseReportDate(dateInput);

  if (period === 'weekly') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    return {
      period,
      start,
      end,
      label: `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`,
    };
  }

  if (period === 'monthly') {
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    return {
      period,
      start,
      end,
      label: format(start, 'MMMM yyyy'),
    };
  }

  const start = startOfDay(date);
  const end = endOfDay(date);

  return {
    period,
    start,
    end,
    label: format(start, 'dd/MM/yyyy'),
  };
};

const roundMoney = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const roundPercent = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const isPaidOrder = (order: ReportOrder) => order.orderPaid === true || order.paid === true;

const sumOrders = (orders: ReportOrder[], selector: (order: ReportOrder) => number) =>
  roundMoney(orders.reduce((sum, order) => sum + (Number(selector(order)) || 0), 0));

export const buildRestaurantReportSummary = ({
  period,
  label,
  start,
  end,
  orders,
}: {
  period: RestaurantReportPeriod;
  label: string;
  start: Date;
  end: Date;
  orders: ReportOrder[];
}): RestaurantReportSummary => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const paidOrdersList = safeOrders.filter(isPaidOrder);
  const completedOrdersList = safeOrders.filter((order) => order.orderStatus === 'completed');
  const canceledOrdersList = safeOrders.filter((order) => order.orderStatus === 'canceled');
  const activeOrdersList = safeOrders.filter(
    (order) => !['completed', 'canceled'].includes(String(order.orderStatus || ''))
  );
  const revenueOrders = paidOrdersList.filter((order) => order.orderStatus !== 'canceled');

  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  revenueOrders.forEach((order) => {
    (order.cartProducts || []).forEach((item) => {
      const name = item.name || 'Menu item';
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const revenue = roundMoney(quantity * (Number(item.price) || 0));
      const current = itemMap.get(name) || { name, quantity: 0, revenue: 0 };

      current.quantity += quantity;
      current.revenue = roundMoney(current.revenue + revenue);
      itemMap.set(name, current);
    });
  });

  const totalOrders = safeOrders.length;
  const paidOrders = paidOrdersList.length;
  const completedOrders = completedOrdersList.length;
  const canceledOrders = canceledOrdersList.length;
  const totalRevenue = sumOrders(paidOrdersList, (order) => Number(order.total) || 0);
  const netRevenue = sumOrders(revenueOrders, (order) => Number(order.total) || 0);
  const canceledValue = sumOrders(canceledOrdersList, (order) => Number(order.total) || 0);
  const itemsSold = Array.from(itemMap.values()).reduce((sum, item) => sum + item.quantity, 0);

  return {
    period,
    label,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalOrders,
    paidOrders,
    unpaidOrders: totalOrders - paidOrders,
    completedOrders,
    canceledOrders,
    activeOrders: activeOrdersList.length,
    totalRevenue,
    netRevenue,
    canceledValue,
    averageOrderValue: paidOrders > 0 ? roundMoney(totalRevenue / paidOrders) : 0,
    totalTax: sumOrders(revenueOrders, (order) => Number(order.taxAmount) || 0),
    deliveryFees: sumOrders(revenueOrders, (order) => Number(order.deliveryFee) || 0),
    couponDiscounts: sumOrders(revenueOrders, (order) => Number(order.couponDiscountAmount) || 0),
    loyaltyDiscounts: sumOrders(revenueOrders, (order) => Number(order.loyaltyDiscount) || 0),
    paymentRate: totalOrders > 0 ? roundPercent((paidOrders / totalOrders) * 100) : 0,
    completionRate: totalOrders > 0 ? roundPercent((completedOrders / totalOrders) * 100) : 0,
    cancellationRate: totalOrders > 0 ? roundPercent((canceledOrders / totalOrders) * 100) : 0,
    itemsSold,
    topItems: Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5),
    hasActivity: totalOrders > 0,
  };
};
