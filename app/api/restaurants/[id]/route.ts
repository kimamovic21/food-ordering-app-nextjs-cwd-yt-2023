import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { notifyWaitingUsersIfRestaurantAcceptingOrders } from '@/libs/restaurantAvailabilityRequests';
import { getRestaurantRatingSummaries } from '@/libs/reviewSummary';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await mongoConnect();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(id)
      .select(
        'name street city postalCode country latitude longitude contact email webAddress description images workingHours blockedDates tax courierFee minimumOrderAmount averagePreparationMinutes averageDeliveryMinutes activeOrderLimit deliveryRadiusKm isPaused pauseReason totalEmployees createdAt updatedAt'
      )
      .lean();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const orderingStatus = getRestaurantOrderingStatus({ restaurant });
    const ratingMap = await getRestaurantRatingSummaries([restaurant._id]);
    const rating = ratingMap.get(String(restaurant._id));
    const activeOrderLimit = Math.min(
      100,
      Math.max(1, Number((restaurant as any).activeOrderLimit) || 10)
    );
    const activeKitchenOrders = await Order.countDocuments({
      restaurantId: restaurant._id,
      orderStatus: { $in: ['placed', 'processing', 'ready'] },
      $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
    });
    const isBusy = activeKitchenOrders >= activeOrderLimit;

    await notifyWaitingUsersIfRestaurantAcceptingOrders({
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      isAcceptingOrders: orderingStatus.isAcceptingOrders && !isBusy,
    });

    return NextResponse.json(
      {
        restaurant: {
          ...restaurant,
          isOpen: orderingStatus.isOpen,
          isPaused: orderingStatus.isPaused,
          pauseReason: orderingStatus.pauseReason,
          isAcceptingOrders: orderingStatus.isAcceptingOrders,
          orderingUnavailableReason: orderingStatus.reason,
          deliveryRadiusKm: orderingStatus.deliveryRadiusKm,
          minimumOrderAmount: Math.min(
            100,
            Math.max(1, Number((restaurant as any).minimumOrderAmount) || 10)
          ),
          activeOrderLimit,
          activeKitchenOrders,
          isBusy,
          averageRating: rating?.averageRating ?? 0,
          ratingCount: rating?.ratingCount ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}
