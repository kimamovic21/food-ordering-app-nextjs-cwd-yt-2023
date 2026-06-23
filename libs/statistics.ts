type DateLike = string | Date | undefined | null;

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const orderStatusLabels: Record<string, string> = {
  placed: 'Placed',
  processing: 'Processing',
  ready: 'Ready',
  transportation: 'In delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  canceled: 'Canceled',
};

export const getPaymentStatus = (order: any) =>
  Boolean(order?.orderPaid ?? order?.paymentStatus ?? order?.paid);

const toDate = (value: DateLike) => {
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const buildMonthlyData = <T>(
  items: T[],
  getDate: (item: T) => DateLike,
  valueKey: string,
  now = new Date()
) => {
  const valuesByMonth: Record<string, number> = {};

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    valuesByMonth[getMonthKey(date)] = 0;
  }

  const monthsAgo = new Date(now);
  monthsAgo.setMonth(monthsAgo.getMonth() - 12);

  items.forEach((item) => {
    const itemDate = toDate(getDate(item));
    const monthKey = getMonthKey(itemDate);

    if (itemDate >= monthsAgo && valuesByMonth[monthKey] !== undefined) {
      valuesByMonth[monthKey]++;
    }
  });

  return Object.entries(valuesByMonth).map(([month, count]) => {
    const [year, monthNum] = month.split('-');
    return {
      month: `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`,
      [valueKey]: count,
    };
  });
};

export const buildDailyData = <T>(
  items: T[],
  getDate: (item: T) => DateLike,
  valueKey: string,
  now = new Date()
) => {
  const valuesByDay: Record<string, number> = {};

  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    valuesByDay[date.toISOString().split('T')[0]] = 0;
  }

  const daysAgo = new Date(now);
  daysAgo.setDate(daysAgo.getDate() - 365);

  items.forEach((item) => {
    const itemDate = toDate(getDate(item));
    const dayKey = itemDate.toISOString().split('T')[0];

    if (itemDate >= daysAgo && valuesByDay[dayKey] !== undefined) {
      valuesByDay[dayKey]++;
    }
  });

  return Object.entries(valuesByDay).map(([date, count]) => ({
    date,
    [valueKey]: count,
  }));
};

export const summarizeOrders = (orders: any[], restaurants: any[] = []) => {
  const restaurantNames = new Map(
    restaurants.map((restaurant) => [
      restaurant._id?.toString(),
      restaurant.name || 'Unknown restaurant',
    ])
  );
  const restaurantStats = new Map<
    string,
    {
      restaurantId: string;
      restaurantName: string;
      orders: number;
      paidOrders: number;
      revenue: number;
    }
  >();

  let paidOrders = 0;
  let unpaidOrders = 0;
  let totalIncome = 0;
  let netRevenue = 0;

  const statusCounts = Object.entries(orderStatusLabels).map(([status, label]) => {
    const count = orders.filter((order) => order.orderStatus === status).length;
    return { status, label, count };
  });

  orders.forEach((order) => {
    const isPaid = getPaymentStatus(order);
    const total = Number(order.total) || 0;
    const restaurantId = order.restaurantId?.toString() || 'unknown';

    if (isPaid) {
      paidOrders++;
      totalIncome += total;

      if (order.orderStatus !== 'canceled') {
        netRevenue += total;
      }
    } else {
      unpaidOrders++;
    }

    const existing = restaurantStats.get(restaurantId) || {
      restaurantId,
      restaurantName: restaurantNames.get(restaurantId) || 'Unknown restaurant',
      orders: 0,
      paidOrders: 0,
      revenue: 0,
    };

    existing.orders++;
    if (isPaid) {
      existing.paidOrders++;
      existing.revenue += total;
    }
    restaurantStats.set(restaurantId, existing);
  });

  const totalOrders = orders.length;
  const canceledOrders = statusCounts.find((item) => item.status === 'canceled')?.count || 0;
  const completedOrders = statusCounts.find((item) => item.status === 'completed')?.count || 0;
  const activeOrders = orders.filter((order) =>
    ['placed', 'processing', 'ready', 'transportation'].includes(order.orderStatus)
  ).length;

  return {
    totalOrders,
    paidOrders,
    unpaidOrders,
    totalIncome,
    netRevenue,
    averageOrderValue: paidOrders ? totalIncome / paidOrders : 0,
    activeOrders,
    completedOrders,
    canceledOrders,
    cancellationRate: totalOrders ? (canceledOrders / totalOrders) * 100 : 0,
    completionRate: totalOrders ? (completedOrders / totalOrders) * 100 : 0,
    paymentConversionRate: totalOrders ? (paidOrders / totalOrders) * 100 : 0,
    statusData: statusCounts,
    topRestaurants: Array.from(restaurantStats.values())
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      .slice(0, 5),
  };
};

export const summarizeUsers = (users: any[]) => {
  const totalUsers = users.length;
  const roleData = ['user', 'admin', 'courier'].map((role) => ({
    role,
    label: role === 'user' ? 'Customers' : role === 'admin' ? 'Admins' : 'Couriers',
    count: users.filter((user) => user.role === role).length,
  }));
  const providerData = ['credentials', 'google'].map((provider) => ({
    provider,
    label: provider === 'google' ? 'Google' : 'Credentials',
    count: users.filter((user) => (user.provider || 'credentials') === provider).length,
  }));
  const verifiedUsers = users.filter((user) => user.emailVerifiedAt).length;

  return {
    totalUsers,
    totalCustomers: roleData.find((item) => item.role === 'user')?.count || 0,
    totalAdmins: roleData.find((item) => item.role === 'admin')?.count || 0,
    totalCouriers: roleData.find((item) => item.role === 'courier')?.count || 0,
    googleUsers: providerData.find((item) => item.provider === 'google')?.count || 0,
    credentialsUsers: providerData.find((item) => item.provider === 'credentials')?.count || 0,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    verificationRate: totalUsers ? (verifiedUsers / totalUsers) * 100 : 0,
    roleData,
    providerData,
  };
};
