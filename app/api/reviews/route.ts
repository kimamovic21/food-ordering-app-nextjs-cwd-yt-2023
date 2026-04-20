import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { mongoConnect } from '@/libs/mongoConnect';
import { Order } from '@/models/order';
import { RestaurantReview } from '@/models/restaurantReview';
import { User } from '@/models/user';

const parseRatingFilter = (value: string | null) => {
  if (!value || value === 'all') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return undefined;
  }

  return parsed;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidRating = (rating: number) => rating >= 1 && rating <= 5 && Number.isInteger(rating);

export async function GET(request: Request) {
  try {
    await mongoConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    // If orderId is provided, return a single review for that order.
    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return Response.json({ error: 'Valid orderId is required' }, { status: 400 });
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return Response.json({ error: 'Order not found' }, { status: 404 });
      }

      const isOrderOwner = order.userId?.toString() === user._id.toString();
      const isAdmin = user.role === 'admin';

      if (!isOrderOwner && !isAdmin) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const review = await RestaurantReview.findOne({ orderId }).lean();
      return Response.json({ review });
    }

    // Otherwise, return all reviews submitted by the authenticated user.
    const search = searchParams.get('search')?.trim() || '';
    const ratingFilter = parseRatingFilter(searchParams.get('rating'));

    if (ratingFilter === undefined) {
      return Response.json(
        { error: 'Rating must be a whole number between 1 and 5' },
        { status: 400 }
      );
    }

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          userId: user._id,
          ...(ratingFilter ? { rating: ratingFilter } : {}),
        },
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $unwind: '$restaurant',
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          'restaurant.name': {
            $regex: escapeRegex(search),
            $options: 'i',
          },
        },
      });
    }

    pipeline.push(
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          rating: 1,
          reviewText: 1,
          createdAt: 1,
          restaurant: {
            _id: '$restaurant._id',
            name: '$restaurant.name',
          },
        },
      }
    );

    const reviews = await RestaurantReview.aggregate(pipeline);

    return Response.json({
      reviews,
      meta: {
        totalCount: reviews.length,
        search,
        rating: ratingFilter,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await mongoConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = await request.json();
    const orderId = String(payload?.orderId || '');
    const reviewText = String(payload?.reviewText || '').trim();
    const rating = Number(payload?.rating);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return Response.json({ error: 'Invalid orderId' }, { status: 400 });
    }

    if (!isValidRating(rating)) {
      return Response.json(
        { error: 'Rating must be a whole number between 1 and 5' },
        { status: 400 }
      );
    }

    if (reviewText.length < 5) {
      return Response.json({ error: 'Review must contain at least 5 characters' }, { status: 400 });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId?.toString() !== user._id.toString()) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const paymentStatus = Boolean(
      (order as any).orderPaid ?? (order as any).paymentStatus ?? (order as any).paid
    );
    if (order.orderStatus !== 'completed' || !paymentStatus) {
      return Response.json(
        { error: 'You can leave a review only for completed and paid orders' },
        { status: 400 }
      );
    }

    const existingReview = await RestaurantReview.findOne({
      orderId: order._id,
      userId: user._id,
    }).lean();

    if (existingReview) {
      return Response.json(
        { error: 'You have already submitted a review for this order' },
        { status: 409 }
      );
    }

    const review = await RestaurantReview.create({
      orderId: order._id,
      userId: user._id,
      restaurantId: order.restaurantId,
      rating,
      reviewText,
    });

    return Response.json({ review });
  } catch (error: any) {
    if (error?.code === 11000) {
      return Response.json({ error: 'This order already has a review' }, { status: 409 });
    }

    console.error('Error saving review:', error);
    return Response.json({ error: 'Failed to save review' }, { status: 500 });
  }
}
