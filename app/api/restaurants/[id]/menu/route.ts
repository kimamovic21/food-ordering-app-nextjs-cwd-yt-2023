import '@/models/category';
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { PipelineStage } from 'mongoose';
import { mongoConnect } from '@/libs/mongoConnect';
import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';

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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await mongoConnect();

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const restaurantId = new mongoose.Types.ObjectId(id);
    const { searchParams } = new URL(req.url);

    const _id = searchParams.get('_id');
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
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return NextResponse.json([], { status: 200 });
      }

      const item = await MenuItem.findOne({ _id, restaurantId }).populate('category');
      return NextResponse.json(item ? [item] : []);
    }

    if (groupBy === 'category') {
      const categoryIds = await MenuItem.distinct('category', { restaurantId });
      const categories = await Category.find({ _id: { $in: categoryIds } }).sort({ name: 1 });
      const summarySort = buildSort(sortBy);

      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await MenuItem.find({ restaurantId, category: category._id })
            .sort(summarySort)
            .limit(perCategory);
          const total = await MenuItem.countDocuments({ restaurantId, category: category._id });

          return {
            _id: category._id,
            name: category.name,
            items,
            total,
          };
        })
      );

      return NextResponse.json({ categories: categoriesWithItems, perCategory });
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
      const matchStage: Record<string, unknown> = { restaurantId };

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
      const items = result?.items ?? [];
      const total = result?.totalCount?.[0]?.count ?? 0;

      return NextResponse.json({ items, total, page, pageSize: limit });
    }

    const items = await MenuItem.find({ restaurantId }).populate('category');
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching restaurant menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant menu items' }, { status: 500 });
  }
}
