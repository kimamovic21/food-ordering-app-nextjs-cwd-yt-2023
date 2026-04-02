import '@/models/category';
import { Category } from '@/models/category';
import { attachRestaurantRatings } from '@/libs/reviewSummary';
import { MenuItem } from '@/models/menuItem';
import { User } from '@/models/user';
import { isAdmin } from '../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import mongoose, { PipelineStage } from 'mongoose';
import cloudinary from '@/libs/cloudinary';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const isValidPriceType = (value: unknown): value is 'single' | 'double' | 'triple' =>
  value === 'single' || value === 'double' || value === 'triple';

const resolvePriceType = (data: Record<string, unknown>): 'single' | 'double' | 'triple' => {
  if (isValidPriceType(data.priceType)) {
    return data.priceType;
  }

  const legacyFoodType = data.foodType;
  if (legacyFoodType === 'drink') {
    return 'single';
  }

  if (data.priceLarge != null && data.priceLarge !== '') {
    return 'triple';
  }

  if (data.priceMedium != null && data.priceMedium !== '') {
    return 'double';
  }

  return 'single';
};

const hasRequiredPricesByType = (
  priceType: 'single' | 'double' | 'triple',
  data: Record<string, unknown>
) => {
  const prices = [data.priceSmall, data.priceMedium, data.priceLarge];
  const requiredCount = priceType === 'single' ? 1 : priceType === 'double' ? 2 : 3;

  return prices.slice(0, requiredCount).every((price) => price != null && price !== '');
};

const toCategorySlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildSort = (sortBy: string): Record<string, 1 | -1> => {
  switch (sortBy) {
    case 'price_asc':
      return { effectivePrice: 1, createdAt: -1 };
    case 'price_desc':
      return { effectivePrice: -1, createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's ID and restaurantId
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'User session not found' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a restaurant
    if (!currentUser.restaurantId) {
      return Response.json(
        { error: 'You must have a restaurant to create menu items' },
        { status: 403 }
      );
    }

    const data = await req.json();

    const priceType = resolvePriceType(data);

    if (!hasRequiredPricesByType(priceType, data)) {
      const requiredCount = priceType === 'single' ? 1 : priceType === 'double' ? 2 : 3;
      return Response.json(
        { error: `Please provide ${requiredCount} price${requiredCount > 1 ? 's' : ''}` },
        { status: 400 }
      );
    }

    // Validate image URL if provided
    if (data.image && typeof data.image === 'string') {
      if (!data.image.startsWith('http')) {
        return Response.json(
          { error: 'Invalid image URL. Must be a valid HTTP(S) URL' },
          { status: 400 }
        );
      }
    }

    const menuItemData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      priceType,
      priceSmall: data.priceSmall ? Number(data.priceSmall) : null,
      priceMedium:
        priceType === 'single' ? null : data.priceMedium ? Number(data.priceMedium) : null,
      priceLarge:
        priceType === 'triple' ? (data.priceLarge ? Number(data.priceLarge) : null) : null,
      adminId: currentUser._id,
      restaurantId: currentUser.restaurantId,
    };

    const menuItemDoc = await MenuItem.create(menuItemData);

    return Response.json(menuItemDoc);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return Response.json({ error: 'Failed to create menu item', details: error }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const { searchParams } = new URL(req.url);
  const _id = searchParams.get('_id');
  const adminId = searchParams.get('adminId');
  const groupBy = searchParams.get('groupBy');
  const perCategory = parsePositiveInt(searchParams.get('perCategory'), 3);
  const query = searchParams.get('q');
  const categoriesParam = searchParams.get('categories');
  const minPrice = parseNumber(searchParams.get('minPrice'));
  const maxPrice = parseNumber(searchParams.get('maxPrice'));
  const sortBy = searchParams.get('sort') || 'newest';
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = parsePositiveInt(searchParams.get('limit'), 10);

  if (_id) {
    const item = await MenuItem.findById(_id).populate('category');
    if (!item) return Response.json([]);
    const withRatings = await attachRestaurantRatings([item]);
    return Response.json(withRatings);
  }

  // If adminId is provided, filter by that admin
  if (adminId) {
    const items = await MenuItem.find({ adminId }).populate('category');
    const withRatings = await attachRestaurantRatings(items);
    return Response.json(withRatings);
  }

  if (groupBy === 'category') {
    const categories = await Category.find().sort({ name: 1 });
    const summarySort = buildSort(sortBy);

    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await MenuItem.find({ category: category._id })
          .sort(summarySort)
          .limit(perCategory);
        const ratedItems = await attachRestaurantRatings(items);
        const total = await MenuItem.countDocuments({ category: category._id });

        return {
          _id: category._id,
          name: category.name,
          items: ratedItems,
          total,
        };
      })
    );

    return Response.json({ categories: categoriesWithItems, perCategory });
  }

  const hasAdvancedQuery =
    Boolean(query) ||
    Boolean(categoriesParam) ||
    minPrice != null ||
    maxPrice != null ||
    Boolean(searchParams.get('sort')) ||
    Boolean(searchParams.get('limit')) ||
    Boolean(searchParams.get('page'));

  if (hasAdvancedQuery) {
    const matchStage: Record<string, unknown> = {};

    if (query) {
      const safeQuery = escapeRegex(query.trim());
      matchStage.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } },
      ];
    }

    if (categoriesParam) {
      const rawValues = categoriesParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const idValues = rawValues
        .filter((value) => mongoose.Types.ObjectId.isValid(value))
        .map((value) => new mongoose.Types.ObjectId(value));

      const slugValues = rawValues
        .filter((value) => !mongoose.Types.ObjectId.isValid(value))
        .map((value) => toCategorySlug(value));

      let categoryIds = idValues;

      if (slugValues.length > 0) {
        const categories = await Category.find({}, { _id: 1, name: 1 });
        const slugToId = new Map(
          categories.map((category) => [toCategorySlug(category.name), category._id])
        );
        const resolved = slugValues
          .map((slug) => slugToId.get(slug))
          .filter((value): value is mongoose.Types.ObjectId => Boolean(value));
        categoryIds = [...categoryIds, ...resolved];
      }

      matchStage.category = { $in: categoryIds };
    }

    const pipeline: PipelineStage[] = [{ $match: matchStage }];

    pipeline.push({
      $addFields: {
        priceValues: {
          $filter: {
            input: ['$priceSmall', '$priceMedium', '$priceLarge'],
            as: 'price',
            cond: { $ne: ['$$price', null] },
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        effectivePrice: { $min: '$priceValues' },
      },
    });

    if (minPrice != null || maxPrice != null) {
      const priceMatch: Record<string, number> = {};
      if (minPrice != null) priceMatch.$gte = minPrice;
      if (maxPrice != null) priceMatch.$lte = maxPrice;

      pipeline.push({ $match: { effectivePrice: priceMatch } });
    }

    pipeline.push({ $sort: buildSort(sortBy) });

    pipeline.push({
      $project: {
        priceValues: 0,
        effectivePrice: 0,
      },
    });

    const skip = (page - 1) * limit;

    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await MenuItem.aggregate(pipeline);
    const items = await attachRestaurantRatings(result?.items ?? []);
    const total = result?.totalCount?.[0]?.count ?? 0;

    return Response.json({ items, total, page, pageSize: limit });
  }

  const items = await MenuItem.find().populate('category');
  const withRatings = await attachRestaurantRatings(items);
  return Response.json(withRatings);
}

export async function PUT(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'User session not found' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { _id, ...data } = await req.json();

    // Check if the menu item belongs to the current user
    const existingItem = await MenuItem.findById(_id);
    if (!existingItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    if (existingItem.adminId.toString() !== currentUser._id.toString()) {
      return Response.json(
        { error: 'You are not authorized to edit this menu item' },
        { status: 403 }
      );
    }

    const priceType = resolvePriceType(data);

    if (!hasRequiredPricesByType(priceType, data)) {
      const requiredCount = priceType === 'single' ? 1 : priceType === 'double' ? 2 : 3;
      return Response.json(
        { error: `Please provide ${requiredCount} price${requiredCount > 1 ? 's' : ''}` },
        { status: 400 }
      );
    }

    // Validate image URL if provided
    if (data.image && typeof data.image === 'string') {
      if (!data.image.startsWith('http')) {
        return Response.json(
          { error: 'Invalid image URL. Must be a valid HTTP(S) URL' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      category: data.category,
      priceType,
      priceSmall: data.priceSmall ? Number(data.priceSmall) : null,
      priceMedium:
        priceType === 'single' ? null : data.priceMedium ? Number(data.priceMedium) : null,
      priceLarge:
        priceType === 'triple' ? (data.priceLarge ? Number(data.priceLarge) : null) : null,
    };

    const updated = await MenuItem.findByIdAndUpdate(_id, updateData, { new: true });

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return Response.json({ error: 'Failed to update menu item', details: error }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current user's ID
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'User session not found' }, { status: 401 });
  }

  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const _id = searchParams.get('_id');

  if (_id) {
    const menuItem = await MenuItem.findById(_id);

    // Check if the menu item belongs to the current user
    if (!menuItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    if (menuItem.adminId.toString() !== currentUser._id.toString()) {
      return Response.json(
        { error: 'You are not authorized to delete this menu item' },
        { status: 403 }
      );
    }

    if (menuItem && menuItem.image) {
      const matches = menuItem.image.match(/menu-items\/([^\.]+)/);
      const publicId = matches ? `menu-items/${matches[1]}` : null;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await MenuItem.deleteOne({ _id });
  }

  return Response.json(true);
}
