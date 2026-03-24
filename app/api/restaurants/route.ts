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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
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

export async function GET(req: NextRequest) {
  try {
    await mongoConnect();

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const requestedLimit = parsePositiveInt(searchParams.get('limit'), 9);
    const limit = Math.min(requestedLimit, 30);
    const query = (searchParams.get('q') || '').trim();

    const filter: Record<string, unknown> = {};

    if (query) {
      const safeQuery = escapeRegex(query);
      filter.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { city: { $regex: safeQuery, $options: 'i' } },
        { country: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .select('name city country street description images workingHours blockedDates createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Restaurant.countDocuments(filter),
    ]);

    const now = new Date();

    const serializedRestaurants = restaurants.map((restaurant) => ({
      _id: restaurant._id,
      name: restaurant.name,
      city: restaurant.city,
      country: restaurant.country,
      street: restaurant.street,
      description: restaurant.description,
      image: Array.isArray(restaurant.images) ? restaurant.images[0] || null : null,
      isOpen: isRestaurantOpen(
        Array.isArray(restaurant.workingHours) ? restaurant.workingHours : [],
        Array.isArray(restaurant.blockedDates) ? restaurant.blockedDates : [],
        now
      ),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        restaurants: serializedRestaurants,
        pagination: {
          total,
          page,
          pageSize: limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}
