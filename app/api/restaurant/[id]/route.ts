import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { getRestaurantOrderingStatus } from '@/libs/restaurantAvailability';
import { getRestaurantRatingSummaries } from '@/libs/reviewSummary';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await mongoConnect();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(id);

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

    return NextResponse.json(
      {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          street: restaurant.street,
          city: restaurant.city,
          postalCode: restaurant.postalCode,
          country: restaurant.country,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          contact: restaurant.contact,
          email: restaurant.email,
          webAddress: restaurant.webAddress,
          description: restaurant.description,
          images: restaurant.images,
          tax: restaurant.tax,
          courierFee: restaurant.courierFee,
          minimumOrderAmount: Math.min(
            100,
            Math.max(1, Number((restaurant as any).minimumOrderAmount) || 10)
          ),
          averagePreparationMinutes: restaurant.averagePreparationMinutes,
          averageDeliveryMinutes: restaurant.averageDeliveryMinutes,
          activeOrderLimit,
          deliveryRadiusKm: orderingStatus.deliveryRadiusKm,
          activeKitchenOrders,
          isBusy,
          isPaused: orderingStatus.isPaused,
          pauseReason: orderingStatus.pauseReason,
          isAcceptingOrders: orderingStatus.isAcceptingOrders,
          orderingUnavailableReason: orderingStatus.reason,
          workingHours: restaurant.workingHours,
          blockedDates: restaurant.blockedDates,
          isOpen: orderingStatus.isOpen,
          averageRating: rating?.averageRating ?? 0,
          ratingCount: rating?.ratingCount ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}
