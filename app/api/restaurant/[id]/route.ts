import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { getRestaurantRatingSummaries } from '@/libs/reviewSummary';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';

// Check if restaurant is open at a specific time
function isRestaurantOpen(
  workingHours: any[],
  blockedDates: any[],
  targetDate: Date = new Date()
): boolean {
  // Check if the date is blocked
  const isBlocked = blockedDates.some((blocked) => {
    const blockedDate = new Date(blocked.date);
    return (
      blockedDate.getFullYear() === targetDate.getFullYear() &&
      blockedDate.getMonth() === targetDate.getMonth() &&
      blockedDate.getDate() === targetDate.getDate()
    );
  });

  if (isBlocked) {
    return false;
  }

  // Get the day of the week
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = targetDate.getDay();
  const dayName = dayNames[dayOfWeek];

  // Find the working hours for this day
  const todayHours = workingHours.find((hours) => hours.day === dayName);

  if (!todayHours) {
    return false;
  }

  if (todayHours.isClosed) {
    return false;
  }

  // Check if current time is within working hours
  const currentTime = targetDate.getHours() * 60 + targetDate.getMinutes();
  const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);

  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  const isOpen = currentTime >= openTime && currentTime <= closeTime;

  return isOpen;
}

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

    // Check if restaurant is currently open
    const now = new Date();
    const isOpen = isRestaurantOpen(restaurant.workingHours, restaurant.blockedDates, now);
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
          contact: restaurant.contact,
          email: restaurant.email,
          webAddress: restaurant.webAddress,
          description: restaurant.description,
          images: restaurant.images,
          tax: restaurant.tax,
          courierFee: restaurant.courierFee,
          averagePreparationMinutes: restaurant.averagePreparationMinutes,
          averageDeliveryMinutes: restaurant.averageDeliveryMinutes,
          activeOrderLimit,
          activeKitchenOrders,
          isBusy,
          workingHours: restaurant.workingHours,
          blockedDates: restaurant.blockedDates,
          isOpen,
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
