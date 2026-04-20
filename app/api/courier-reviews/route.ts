import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { mongoConnect } from '@/libs/mongoConnect';
import { CourierReview } from '@/models/courierReview';
import { Order } from '@/models/order';
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const courierId = searchParams.get('courierId');
    const mine = searchParams.get('mine') === 'true';

    // Read a single courier review by order for the authenticated order owner.
    if (orderId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return Response.json({ error: 'Valid orderId is required' }, { status: 400 });
      }

      const user = await User.findOne({ email: session.user.email }).lean();
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
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

      const review = await CourierReview.findOne({ orderId, userId: user._id }).lean();
      return Response.json({ review });
    }

    // Courier dashboard listing for authenticated courier.
    if (mine) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const courier = await User.findOne({ email: session.user.email }).lean();
      if (!courier) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      if (courier.role !== 'courier') {
        return Response.json({ error: 'Only couriers can access this' }, { status: 403 });
      }

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
            courierId: courier._id,
            ...(ratingFilter ? { rating: ratingFilter } : {}),
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      if (search) {
        pipeline.push({
          $match: {
            'customer.name': {
              $regex: escapeRegex(search),
              $options: 'i',
            },
          },
        });
      }

      pipeline.push(
        { $sort: { createdAt: -1 } },
        {
          $project: {
            rating: 1,
            reviewText: 1,
            createdAt: 1,
            orderId: 1,
            customer: {
              _id: '$customer._id',
              name: '$customer.name',
            },
          },
        }
      );

      const reviews = await CourierReview.aggregate(pipeline);
      const summary = await CourierReview.aggregate([
        { $match: { courierId: courier._id } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalCount: { $sum: 1 },
          },
        },
      ]);

      return Response.json({
        reviews,
        meta: {
          totalCount: reviews.length,
          search,
          rating: ratingFilter,
        },
        summary: {
          averageRating: Number(summary[0]?.averageRating || 0),
          totalCount: Number(summary[0]?.totalCount || 0),
        },
      });
    }

    // Public listing by courierId for regular users.
    if (!courierId || !mongoose.Types.ObjectId.isValid(courierId)) {
      return Response.json({ error: 'Valid courierId is required' }, { status: 400 });
    }

    const targetCourier = await User.findById(courierId).select('name image role').lean();
    if (!targetCourier || targetCourier.role !== 'courier') {
      return Response.json({ error: 'Courier not found' }, { status: 404 });
    }

    const publicReviews = await CourierReview.aggregate([
      {
        $match: {
          courierId: new mongoose.Types.ObjectId(courierId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          rating: 1,
          reviewText: 1,
          createdAt: 1,
          customer: {
            name: '$customer.name',
          },
        },
      },
    ]);

    const summary = await CourierReview.aggregate([
      { $match: { courierId: new mongoose.Types.ObjectId(courierId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    return Response.json({
      courier: {
        _id: targetCourier._id,
        name: targetCourier.name,
        image: targetCourier.image || null,
      },
      reviews: publicReviews,
      summary: {
        averageRating: Number(summary[0]?.averageRating || 0),
        totalCount: Number(summary[0]?.totalCount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching courier reviews:', error);
    return Response.json({ error: 'Failed to fetch courier reviews' }, { status: 500 });
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

    if (!order.courierId || !mongoose.Types.ObjectId.isValid(String(order.courierId))) {
      return Response.json(
        { error: 'Courier is not assigned yet for this order' },
        { status: 400 }
      );
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

    const existingReview = await CourierReview.findOne({
      orderId: order._id,
      userId: user._id,
      courierId: order.courierId,
    }).lean();

    if (existingReview) {
      return Response.json(
        { error: 'You have already submitted a courier review for this order' },
        { status: 409 }
      );
    }

    const review = await CourierReview.create({
      orderId: order._id,
      userId: user._id,
      courierId: order.courierId,
      rating,
      reviewText,
    });

    return Response.json({ review });
  } catch (error: any) {
    if (error?.code === 11000) {
      return Response.json(
        { error: 'This order already has a courier review from you' },
        { status: 409 }
      );
    }

    console.error('Error saving courier review:', error);
    return Response.json({ error: 'Failed to save courier review' }, { status: 500 });
  }
}
