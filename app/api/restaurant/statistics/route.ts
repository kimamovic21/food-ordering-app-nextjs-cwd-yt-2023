import { authOptions } from '@/libs/authOptions';
import { getPaymentStatus } from '@/libs/statistics';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { User } from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can access statistics' }, { status: 403 });
    }

    if (!user.restaurantId) {
      return NextResponse.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
    }

    const restaurantId = user.restaurantId;

    // Fetch all orders for this restaurant
    const [orders, menuItems] = await Promise.all([
      Order.find({ restaurantId }).lean(),
      MenuItem.find({ restaurantId }).select('_id name').lean(),
    ]);

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => order.orderStatus === 'completed').length;
    const unsuccessfulOrders = totalOrders - completedOrders;
    const totalIncome = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const menuPerformanceById = new Map<
      string,
      {
        menuItemId: string;
        name: string;
        quantitySold: number;
        revenue: number;
        orderCount: number;
        canceledQuantity: number;
        canceledOrderCount: number;
      }
    >();

    menuItems.forEach((item: any) => {
      const menuItemId = item._id.toString();
      menuPerformanceById.set(menuItemId, {
        menuItemId,
        name: item.name || 'Unknown item',
        quantitySold: 0,
        revenue: 0,
        orderCount: 0,
        canceledQuantity: 0,
        canceledOrderCount: 0,
      });
    });

    orders.forEach((order: any) => {
      const isPaid = getPaymentStatus(order);
      const isCanceled = order.orderStatus === 'canceled';
      const countedOrderItems = new Set<string>();
      const canceledOrderItems = new Set<string>();

      (order.cartProducts || []).forEach((product: any) => {
        const menuItemId = product.productId?.toString?.() || String(product.productId || '');

        if (!menuItemId) {
          return;
        }

        const current = menuPerformanceById.get(menuItemId) || {
          menuItemId,
          name: product.name || 'Deleted menu item',
          quantitySold: 0,
          revenue: 0,
          orderCount: 0,
          canceledQuantity: 0,
          canceledOrderCount: 0,
        };
        const quantity = Math.max(1, Number(product.quantity) || 1);
        const revenue = (Number(product.price) || 0) * quantity;

        if (isCanceled) {
          current.canceledQuantity += quantity;
          canceledOrderItems.add(menuItemId);
        } else if (isPaid) {
          current.quantitySold += quantity;
          current.revenue += revenue;
          countedOrderItems.add(menuItemId);
        }

        menuPerformanceById.set(menuItemId, current);
      });

      countedOrderItems.forEach((menuItemId) => {
        const current = menuPerformanceById.get(menuItemId);
        if (current) {
          current.orderCount += 1;
        }
      });

      canceledOrderItems.forEach((menuItemId) => {
        const current = menuPerformanceById.get(menuItemId);
        if (current) {
          current.canceledOrderCount += 1;
        }
      });
    });

    const menuPerformance = Array.from(menuPerformanceById.values()).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));
    const topSellingItems = [...menuPerformance]
      .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
      .slice(0, 5);
    const leastOrderedItems = [...menuPerformance]
      .sort((a, b) => a.quantitySold - b.quantitySold || a.name.localeCompare(b.name))
      .slice(0, 5);
    const mostCanceledItems = [...menuPerformance]
      .filter((item) => item.canceledQuantity > 0)
      .sort(
        (a, b) =>
          b.canceledQuantity - a.canceledQuantity || b.canceledOrderCount - a.canceledOrderCount
      )
      .slice(0, 5);
    const totalMenuRevenue = menuPerformance.reduce((sum, item) => sum + item.revenue, 0);

    // Count unique users who ordered
    const uniqueUserIds = new Set();
    orders.forEach((order) => {
      if (order.userId) {
        uniqueUserIds.add(order.userId.toString());
      }
    });
    const totalUniqueUsers = uniqueUserIds.size;

    return NextResponse.json(
      {
        statistics: {
          totalUniqueUsers,
          totalOrders,
          completedOrders,
          unsuccessfulOrders,
          totalIncome: Math.round(totalIncome * 100) / 100, // Round to 2 decimal places
          menuPerformance: {
            totalMenuItems: menuItems.length,
            totalMenuRevenue: Math.round(totalMenuRevenue * 100) / 100,
            topSellingItems,
            leastOrderedItems,
            mostCanceledItems,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
