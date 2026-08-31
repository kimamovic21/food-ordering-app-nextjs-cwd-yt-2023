export type StatisticsTimeRange = '7d' | '30d' | '3m' | '6m' | '12m';

export type StatisticsStatusData = {
  status: string;
  label: string;
  count: number;
};

export type StatisticsRestaurantData = {
  restaurantId: string;
  restaurantName: string;
  orders: number;
  paidOrders: number;
  revenue: number;
};

export type StatisticsMonthlyData<TValueKey extends string> = {
  month: string;
} & Record<TValueKey, number>;

export type StatisticsDailyData<TValueKey extends string> = {
  date: string;
} & Record<TValueKey, number>;

export type OrdersStatistics = {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalIncome: number;
  netRevenue: number;
  averageOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  canceledOrders: number;
  cancellationRate: number;
  completionRate: number;
  paymentConversionRate: number;
  statusData: StatisticsStatusData[];
  topRestaurants: StatisticsRestaurantData[];
  monthlyData: StatisticsMonthlyData<'orders'>[];
  dailyData: StatisticsDailyData<'orders'>[];
};

export type UsersStatistics = {
  totalUsers: number;
  totalCustomers: number;
  totalAdmins: number;
  totalCouriers: number;
  googleUsers: number;
  credentialsUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  verificationRate: number;
  roleData: { role: string; label: string; count: number }[];
  providerData: { provider: string; label: string; count: number }[];
  monthlyData: StatisticsMonthlyData<'users'>[];
  dailyData: StatisticsDailyData<'users'>[];
};

export type StatisticsSummary = Omit<
  OrdersStatistics,
  'completionRate' | 'monthlyData' | 'dailyData'
> &
  Pick<UsersStatistics, 'totalUsers' | 'totalCustomers' | 'totalAdmins' | 'totalCouriers'> & {
    totalRestaurants: number;
    totalMenuItems: number;
    unavailableMenuItems: number;
    openSupportTickets: number;
    unreadNotifications: number;
  };
