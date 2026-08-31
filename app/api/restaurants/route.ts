import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { getRestaurantRatingSummaries } from '@/libs/reviewSummary';
import { Restaurant } from '@/models/restaurant';
import type { RestaurantBlockedDate, RestaurantWorkingHour } from '@/types/restaurant';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const parseCoordinate = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidCoordinatePair = (latitude: number | null, longitude: number | null) => {
  if (latitude === null || longitude === null) {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isRestaurantOpen = (
  workingHours: RestaurantWorkingHour[] = [],
  blockedDates: RestaurantBlockedDate[] = [],
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
    const latitude = parseCoordinate(searchParams.get('latitude'));
    const longitude = parseCoordinate(searchParams.get('longitude'));
    const hasValidLocation = isValidCoordinatePair(latitude, longitude);

    const filter: Record<string, unknown> = {};

    if (query) {
      const safeQuery = escapeRegex(query);
      filter.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { city: { $regex: safeQuery, $options: 'i' } },
        { country: { $regex: safeQuery, $options: 'i' } },
        { street: { $regex: safeQuery, $options: 'i' } },
        { postalCode: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    const sortByDistance = hasValidLocation && latitude !== null && longitude !== null;

    const [restaurants, total] = sortByDistance
      ? await Promise.all([
          Restaurant.find(filter)
            .select(
              'name city country street postalCode description images workingHours blockedDates createdAt latitude longitude'
            )
            .lean(),
          Restaurant.countDocuments(filter),
        ])
      : await Promise.all([
          Restaurant.find(filter)
            .select(
              'name city country street description images workingHours blockedDates createdAt'
            )
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Restaurant.countDocuments(filter),
        ]);

    const now = new Date();

    const enrichedRestaurants = restaurants.map((restaurant) => {
      const hasRestaurantCoordinates =
        typeof restaurant.latitude === 'number' && typeof restaurant.longitude === 'number';

      const distanceKm =
        sortByDistance && hasRestaurantCoordinates
          ? calculateDistanceKm(latitude, longitude, restaurant.latitude, restaurant.longitude)
          : null;

      return {
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
        distanceKm,
      };
    });

    const sortedRestaurants = sortByDistance
      ? [...enrichedRestaurants].sort((a, b) => {
          const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;

          if (aDistance !== bDistance) {
            return aDistance - bDistance;
          }

          return String(a.name).localeCompare(String(b.name));
        })
      : enrichedRestaurants;

    const paginatedRestaurants = sortByDistance
      ? sortedRestaurants.slice((page - 1) * limit, page * limit)
      : sortedRestaurants;

    const ratingMap = await getRestaurantRatingSummaries(
      paginatedRestaurants.map((restaurant) => restaurant._id)
    );

    const ratedRestaurants = paginatedRestaurants.map((restaurant) => {
      const rating = ratingMap.get(String(restaurant._id));

      return {
        ...restaurant,
        averageRating: rating?.averageRating ?? 0,
        ratingCount: rating?.ratingCount ?? 0,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        restaurants: ratedRestaurants,
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
