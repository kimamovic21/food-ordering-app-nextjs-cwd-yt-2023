import { Review } from '@/models/review';
import mongoose from 'mongoose';

type RestaurantRatingSummary = {
  averageRating: number;
  ratingCount: number;
};

const normalizeRestaurantId = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (
    typeof value === 'object' &&
    value !== null &&
    '_id' in (value as Record<string, unknown>) &&
    mongoose.Types.ObjectId.isValid(String((value as Record<string, unknown>)._id))
  ) {
    return String((value as Record<string, unknown>)._id);
  }

  return null;
};

export const getRestaurantRatingSummaries = async (restaurantIds: unknown[]) => {
  const uniqueIds = Array.from(
    new Set(restaurantIds.map(normalizeRestaurantId).filter((id): id is string => Boolean(id)))
  );

  if (uniqueIds.length === 0) {
    return new Map<string, RestaurantRatingSummary>();
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const grouped = await Review.aggregate<{
    _id: mongoose.Types.ObjectId;
    averageRating: number;
    ratingCount: number;
  }>([
    { $match: { restaurantId: { $in: objectIds } } },
    {
      $group: {
        _id: '$restaurantId',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, RestaurantRatingSummary>();

  for (const item of grouped) {
    map.set(item._id.toString(), {
      averageRating: Number(item.averageRating.toFixed(2)),
      ratingCount: item.ratingCount,
    });
  }

  return map;
};

export const attachRestaurantRatings = async <T extends { restaurantId?: unknown }>(items: T[]) => {
  const ratingsMap = await getRestaurantRatingSummaries(items.map((item) => item.restaurantId));

  return items.map((item) => {
    const plainItem =
      typeof (item as any)?.toObject === 'function' ? (item as any).toObject() : (item as object);
    const restaurantId = normalizeRestaurantId((plainItem as any).restaurantId);
    const rating = restaurantId ? ratingsMap.get(restaurantId) : undefined;

    return {
      ...plainItem,
      restaurantAverageRating: rating?.averageRating ?? 0,
      restaurantRatingCount: rating?.ratingCount ?? 0,
    } as T & {
      restaurantAverageRating: number;
      restaurantRatingCount: number;
    };
  });
};
