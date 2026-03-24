import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { Restaurant } from '@/models/restaurant';

type WorkingHour = {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
};

type BlockedDate = {
  date: string | Date;
};

const isRestaurantOpen = (
  workingHours: WorkingHour[] = [],
  blockedDates: BlockedDate[] = [],
  targetDate: Date = new Date()
) => {
  const isBlocked = blockedDates.some((blocked) => {
    const blockedDate = new Date(blocked.date);

    if (Number.isNaN(blockedDate.getTime())) {
      return false;
    }

    return (
      blockedDate.getFullYear() === targetDate.getFullYear() &&
      blockedDate.getMonth() === targetDate.getMonth() &&
      blockedDate.getDate() === targetDate.getDate()
    );
  });

  if (isBlocked) {
    return false;
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[targetDate.getDay()];
  const todayHours = workingHours.find((hours) => hours.day === dayName);

  if (!todayHours || todayHours.isClosed) {
    return false;
  }

  const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);

  if (
    Number.isNaN(openHour) ||
    Number.isNaN(openMinute) ||
    Number.isNaN(closeHour) ||
    Number.isNaN(closeMinute)
  ) {
    return false;
  }

  const currentTime = targetDate.getHours() * 60 + targetDate.getMinutes();
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  return currentTime >= openTime && currentTime <= closeTime;
};

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await mongoConnect();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(id)
      .select(
        'name street city postalCode country latitude longitude contact email webAddress description images workingHours blockedDates tax courierFee totalEmployees createdAt updatedAt'
      )
      .lean();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const isOpen = isRestaurantOpen(
      Array.isArray(restaurant.workingHours) ? restaurant.workingHours : [],
      Array.isArray(restaurant.blockedDates) ? restaurant.blockedDates : [],
      new Date()
    );

    return NextResponse.json(
      {
        restaurant: {
          ...restaurant,
          isOpen,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}
