import { NextRequest, NextResponse } from 'next/server';
import { mongoConnect } from '@/libs/mongoConnect';
import { Restaurant } from '@/models/restaurant';
import { Review } from '@/models/review';
import mongoose from 'mongoose';

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
};

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await mongoConnect();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const restaurant = await Restaurant.findById(id).select('name').lean();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10) || 10, 50);
    const offset = parsePositiveInt(searchParams.get('offset'), 0);

    const [totalCount, rawReviews] = await Promise.all([
      Review.countDocuments({ restaurantId: id }),
      Review.find({ restaurantId: id })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('userId', 'name image')
        .lean(),
    ]);

    const reviews = rawReviews.map((review: any) => ({
      _id: String(review._id),
      rating: Number(review.rating) || 0,
      reviewText: review.reviewText || '',
      createdAt: review.createdAt,
      user: {
        name: review?.userId?.name || 'Anonymous user',
        image: review?.userId?.image || null,
      },
    }));

    const nextOffset = offset + reviews.length;

    return NextResponse.json(
      {
        restaurant: {
          _id: String(restaurant._id),
          name: restaurant.name,
        },
        reviews,
        meta: {
          totalCount,
          offset,
          limit,
          nextOffset,
          hasMore: nextOffset < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant reviews' }, { status: 500 });
  }
}
