import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { mongoConnect } from '@/libs/mongoConnect';
import { Coupon } from '@/models/coupon';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import { createAuditLog } from '@/libs/auditLog';
import {
  calculateCouponDiscountAmount,
  getCouponDateValidationError,
  getCouponValidationError,
  isValidCouponCode,
  normalizeCouponCode,
} from '@/libs/coupon';

const DEFAULT_LIMIT = 5;

const serializeCoupon = (coupon: any) => ({
  _id: coupon._id.toString(),
  restaurantId: coupon.restaurantId?.toString?.() || String(coupon.restaurantId || ''),
  createdBy: coupon.createdBy?.toString?.() || String(coupon.createdBy || ''),
  updatedBy: coupon.updatedBy?.toString?.() || null,
  code: coupon.code,
  title: coupon.title,
  description: coupon.description,
  discountType: coupon.discountType,
  discountValue: Number(coupon.discountValue) || 0,
  minimumOrderAmount: Number(coupon.minimumOrderAmount) || 0,
  maxDiscountAmount:
    typeof coupon.maxDiscountAmount === 'number' ? Number(coupon.maxDiscountAmount) : null,
  usageLimit: typeof coupon.usageLimit === 'number' ? coupon.usageLimit : null,
  usagePerCustomer: Number(coupon.usagePerCustomer) || 1,
  usageCount: Number(coupon.usageCount) || 0,
  startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString() : null,
  expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
  isActive: Boolean(coupon.isActive),
  isPublic: Boolean(coupon.isPublic),
  firstOrderOnly: Boolean(coupon.firstOrderOnly),
  terms: coupon.terms || '',
  tags: Array.isArray(coupon.tags) ? coupon.tags : [],
  lastUsedAt: coupon.lastUsedAt ? new Date(coupon.lastUsedAt).toISOString() : null,
  createdAt: coupon.createdAt ? new Date(coupon.createdAt).toISOString() : null,
  updatedAt: coupon.updatedAt ? new Date(coupon.updatedAt).toISOString() : null,
});

const getRestaurantForAdmin = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user || user.role !== 'admin') {
    return null;
  }

  const restaurant = user.restaurantId
    ? await Restaurant.findById(user.restaurantId)
    : await Restaurant.findOne({ ownerId: user._id });

  if (!restaurant) {
    return null;
  }

  return { user, restaurant };
};

const buildCouponPayload = (body: Record<string, unknown>) => {
  const code = normalizeCouponCode(typeof body.code === 'string' ? body.code : '');
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const discountValue = Math.round(Number(body.discountValue ?? body.discountPercentage ?? 0));
  const minimumOrderAmount = Math.max(0, Number(body.minimumOrderAmount) || 0);
  const maxDiscountAmount =
    body.maxDiscountAmount === null || body.maxDiscountAmount === ''
      ? null
      : Math.max(0, Number(body.maxDiscountAmount) || 0);
  const usageLimit =
    body.usageLimit === null || body.usageLimit === ''
      ? null
      : Math.max(1, Number(body.usageLimit) || 0);
  const usagePerCustomer = Math.max(1, Number(body.usagePerCustomer) || 1);
  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : new Date();
  const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;
  const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
  const isPublic = body.isPublic !== undefined ? Boolean(body.isPublic) : true;
  const firstOrderOnly = Boolean(body.firstOrderOnly);
  const terms = typeof body.terms === 'string' ? body.terms.trim() : '';
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    code,
    title,
    description,
    discountType: 'percentage' as const,
    discountValue,
    minimumOrderAmount,
    maxDiscountAmount,
    usageLimit,
    usagePerCustomer,
    startsAt,
    expiresAt,
    isActive,
    isPublic,
    firstOrderOnly,
    terms,
    tags,
  };
};

export async function GET(request: Request) {
  await mongoConnect();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const restaurantId = url.searchParams.get('restaurantId');

  if (code) {
    const normalizedCode = normalizeCouponCode(code);
    if (!isValidCouponCode(normalizedCode)) {
      return Response.json(
        { valid: false, error: 'Coupon for this restaurant not available' },
        { status: 400 }
      );
    }

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return Response.json(
        { valid: false, error: 'Coupon for this restaurant not available' },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, Number(url.searchParams.get('subtotal') || 0));
    const coupon = await Coupon.findOne({
      code: normalizedCode,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    }).lean();

    if (!coupon) {
      return Response.json(
        { valid: false, error: 'Coupon for this restaurant not available' },
        { status: 404 }
      );
    }

    let completedOrderCount = 0;
    let customerCouponUsageCount = 0;

    if (coupon.firstOrderOnly || coupon.usagePerCustomer) {
      const session = await getServerSession(authOptions);
      const user = session?.user?.email ? await User.findOne({ email: session.user.email }) : null;

      if (!user) {
        return Response.json(
          { valid: false, error: 'Sign in to use this coupon.' },
          { status: 401 }
        );
      }

      [completedOrderCount, customerCouponUsageCount] = await Promise.all([
        Order.countDocuments({ userId: user._id, orderStatus: 'completed' }),
        Order.countDocuments({
          userId: user._id,
          couponId: coupon._id,
          orderStatus: { $ne: 'canceled' },
          $or: [{ orderPaid: true }, { paid: true }, { paymentStatus: true }],
        }),
      ]);
    }

    const validationError = getCouponValidationError({
      coupon,
      subtotal,
      completedOrderCount,
      customerCouponUsageCount,
    });
    if (validationError) {
      return Response.json({ valid: false, error: validationError }, { status: 400 });
    }

    const discountAmount = calculateCouponDiscountAmount(subtotal, coupon);

    return Response.json({
      valid: true,
      coupon: serializeCoupon(coupon),
      discountAmount,
      message: `Coupon applied successfully. You saved $${discountAmount.toFixed(2)}.`,
    });
  }

  const id = url.searchParams.get('id');
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid coupon ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminContext = await getRestaurantForAdmin(session.user.email);
    if (!adminContext) {
      return Response.json(
        { error: 'Create a restaurant before managing coupons' },
        { status: 403 }
      );
    }

    const coupon = await Coupon.findOne({
      _id: id,
      restaurantId: adminContext.restaurant._id,
    }).lean();
    if (!coupon) {
      return Response.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return Response.json({ coupon: serializeCoupon(coupon) });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminContext = await getRestaurantForAdmin(session.user.email);
  if (!adminContext) {
    return Response.json({ error: 'Create a restaurant before managing coupons' }, { status: 403 });
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(
    1,
    Math.min(20, parseInt(url.searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10))
  );
  const skip = (page - 1) * limit;

  const query = { restaurantId: adminContext.restaurant._id };
  const totalCoupons = await Coupon.countDocuments(query);
  const coupons = await Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const totalPages = Math.ceil(totalCoupons / limit) || 1;

  return Response.json({
    coupons: coupons.map(serializeCoupon),
    page,
    totalPages,
    totalCoupons,
  });
}

export async function POST(request: Request) {
  await mongoConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminContext = await getRestaurantForAdmin(session.user.email);
  if (!adminContext) {
    return Response.json({ error: 'Create a restaurant before managing coupons' }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const payload = buildCouponPayload(body);

  if (!payload.code || !isValidCouponCode(payload.code)) {
    return Response.json(
      { error: 'Coupon code must contain only capital letters and numbers.' },
      { status: 400 }
    );
  }

  if (!payload.title || !payload.description) {
    return Response.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  if (
    !Number.isFinite(payload.discountValue) ||
    payload.discountValue < 5 ||
    payload.discountValue > 90
  ) {
    return Response.json(
      { error: 'Discount percentage must be between 5 and 90.' },
      { status: 400 }
    );
  }

  const dateValidationError = getCouponDateValidationError({
    startsAt: payload.startsAt,
    expiresAt: payload.expiresAt,
  });

  if (dateValidationError) {
    return Response.json({ error: dateValidationError }, { status: 400 });
  }

  const existingCoupon = await Coupon.findOne({
    restaurantId: adminContext.restaurant._id,
    code: payload.code,
  });

  if (existingCoupon) {
    return Response.json(
      { error: 'A coupon with that code already exists for this restaurant.' },
      { status: 400 }
    );
  }

  const coupon = await Coupon.create({
    ...payload,
    restaurantId: adminContext.restaurant._id,
    createdBy: adminContext.user._id,
    updatedBy: adminContext.user._id,
  });

  await createAuditLog({
    actor: adminContext.user,
    action: 'coupon.created',
    entityType: 'coupon',
    entityId: coupon._id,
    restaurantId: adminContext.restaurant._id,
    metadata: { code: coupon.code, discountValue: coupon.discountValue },
  });

  return Response.json({ coupon: serializeCoupon(coupon) }, { status: 201 });
}

export async function PUT(request: Request) {
  await mongoConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminContext = await getRestaurantForAdmin(session.user.email);
  if (!adminContext) {
    return Response.json({ error: 'Create a restaurant before managing coupons' }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body._id === 'string' ? body._id : typeof body.id === 'string' ? body.id : '';

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid coupon ID' }, { status: 400 });
  }

  const existingCoupon = await Coupon.findOne({
    _id: id,
    restaurantId: adminContext.restaurant._id,
  });

  if (!existingCoupon) {
    return Response.json({ error: 'Coupon not found' }, { status: 404 });
  }

  const payload = buildCouponPayload(body);

  if (!payload.code || !isValidCouponCode(payload.code)) {
    return Response.json(
      { error: 'Coupon code must contain only capital letters and numbers.' },
      { status: 400 }
    );
  }

  if (!payload.title || !payload.description) {
    return Response.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  if (
    !Number.isFinite(payload.discountValue) ||
    payload.discountValue < 5 ||
    payload.discountValue > 90
  ) {
    return Response.json(
      { error: 'Discount percentage must be between 5 and 90.' },
      { status: 400 }
    );
  }

  const dateValidationError = getCouponDateValidationError({
    startsAt: payload.startsAt,
    expiresAt: payload.expiresAt,
  });

  if (dateValidationError) {
    return Response.json({ error: dateValidationError }, { status: 400 });
  }

  const duplicateCoupon = await Coupon.findOne({
    restaurantId: adminContext.restaurant._id,
    code: payload.code,
    _id: { $ne: id },
  });

  if (duplicateCoupon) {
    return Response.json(
      { error: 'A coupon with that code already exists for this restaurant.' },
      { status: 400 }
    );
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    id,
    {
      ...payload,
      updatedBy: adminContext.user._id,
      restaurantId: adminContext.restaurant._id,
    },
    { new: true, runValidators: true }
  );

  await createAuditLog({
    actor: adminContext.user,
    action: 'coupon.updated',
    entityType: 'coupon',
    entityId: id,
    restaurantId: adminContext.restaurant._id,
    metadata: { code: payload.code, discountValue: payload.discountValue },
  });

  return Response.json({ coupon: serializeCoupon(updatedCoupon) });
}

export async function DELETE(request: Request) {
  await mongoConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminContext = await getRestaurantForAdmin(session.user.email);
  if (!adminContext) {
    return Response.json({ error: 'Create a restaurant before managing coupons' }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid coupon ID' }, { status: 400 });
  }

  const deleted = await Coupon.findOneAndDelete({
    _id: id,
    restaurantId: adminContext.restaurant._id,
  });

  if (!deleted) {
    return Response.json({ error: 'Coupon not found' }, { status: 404 });
  }

  await createAuditLog({
    actor: adminContext.user,
    action: 'coupon.deleted',
    entityType: 'coupon',
    entityId: id,
    restaurantId: adminContext.restaurant._id,
    metadata: { code: deleted.code },
  });

  return Response.json({ message: 'Coupon deleted successfully' });
}
