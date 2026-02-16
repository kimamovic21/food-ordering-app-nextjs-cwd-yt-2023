import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/libs/authOptions';
import { mongoConnect } from '@/libs/mongoConnect';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import cloudinary from '@/libs/cloudinary';

type BlockedDateInput = {
  date?: string | Date;
  reason?: string;
};

const normalizeBlockedDates = (blockedDates: unknown) => {
  if (!Array.isArray(blockedDates)) {
    return [] as { date: Date; reason: string }[];
  }

  const normalized: { date: Date; reason: string }[] = [];

  for (const entry of blockedDates as BlockedDateInput[]) {
    const reason = typeof entry.reason === 'string' ? entry.reason.trim() : '';
    const rawDate = entry.date instanceof Date ? entry.date : new Date(entry.date || '');

    if (!reason || Number.isNaN(rawDate.getTime())) {
      console.error(
        'Invalid blocked date entry - reason:',
        reason,
        'date valid:',
        !Number.isNaN(rawDate.getTime())
      );
      throw new Error('Invalid blocked date entry');
    }

    normalized.push({ date: rawDate, reason });
  }

  return normalized;
};

const sanitizeRestaurantPayload = (body: Record<string, unknown>, includeId: boolean = false) => {
  const tax = typeof body.tax === 'number' ? body.tax : Number(body.tax) || 17;
  const courierFee =
    typeof body.courierFee === 'number' ? body.courierFee : Number(body.courierFee) || 5;
  const totalEmployees =
    typeof body.totalEmployees === 'number'
      ? body.totalEmployees
      : Number(body.totalEmployees) || 1;

  // Handle images array
  let images: string[] = [];
  if (Array.isArray(body.images)) {
    images = body.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '');
  } else if (typeof body.image === 'string' && body.image.trim() !== '') {
    // Backward compatibility: convert single image to array
    images = [body.image];
  }

  const payload: any = {
    name: body.name,
    street: body.street,
    city: body.city,
    postalCode: body.postalCode,
    country: body.country,
    latitude: Number(body.latitude) || 0,
    longitude: Number(body.longitude) || 0,
    contact: body.contact,
    email: body.email,
    webAddress: body.webAddress || '',
    description: body.description,
    tax: Math.min(100, Math.max(0, tax)),
    courierFee: Math.max(0, courierFee),
    workingHours: Array.isArray(body.workingHours) ? body.workingHours : [],
    blockedDates: normalizeBlockedDates(body.blockedDates),
    totalEmployees: Math.max(1, totalEmployees),
    images,
  };

  if (includeId && body._id) {
    payload._id = body._id;
  }

  return payload;
};

export async function GET() {
  try {
    await mongoConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can access restaurant data' },
        { status: 403 }
      );
    }

    // Get restaurant by owner ID
    let restaurant = await Restaurant.findOne({ ownerId: user._id });

    if (!restaurant) {
      return NextResponse.json({ restaurant: null }, { status: 200 });
    }

    const legacyTaxRules = (restaurant as any).taxRules as { percentage?: number }[] | undefined;

    if (legacyTaxRules && legacyTaxRules.length > 0) {
      const legacyTax =
        typeof legacyTaxRules[0]?.percentage === 'number'
          ? legacyTaxRules[0]?.percentage
          : restaurant.tax;

      restaurant = await Restaurant.findByIdAndUpdate(
        restaurant._id,
        { $set: { tax: legacyTax }, $unset: { taxRules: '' } },
        { new: true }
      );
    }

    // Migrate old 'image' field to 'images' array for backward compatibility
    const legacyImage = (restaurant as any).image as string | undefined;
    if (legacyImage && (!restaurant.images || restaurant.images.length === 0)) {
      restaurant = await Restaurant.findByIdAndUpdate(
        restaurant._id,
        { $set: { images: [legacyImage] }, $unset: { image: '' } },
        { new: true }
      );
    }

    return NextResponse.json({ restaurant }, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create restaurants' }, { status: 403 });
    }

    // Check if admin already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerId: user._id });
    if (existingRestaurant) {
      return NextResponse.json({ error: 'You already have a restaurant' }, { status: 400 });
    }

    const body = await req.json();
    const payload = sanitizeRestaurantPayload(body, false);

    // Validate description length
    if (
      payload.description &&
      (payload.description.length < 20 || payload.description.length > 200)
    ) {
      return NextResponse.json(
        { error: 'Description must be between 20 and 200 characters' },
        { status: 400 }
      );
    }

    if (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
      return NextResponse.json({ error: 'At least one restaurant image is required' }, { status: 400 });
    }

    if (payload.images.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
    }

    // Create restaurant
    const restaurantData = {
      ownerId: user._id,
      name: payload.name,
      street: payload.street,
      city: payload.city,
      postalCode: payload.postalCode,
      country: payload.country,
      latitude: payload.latitude,
      longitude: payload.longitude,
      contact: payload.contact,
      email: payload.email,
      webAddress: payload.webAddress,
      description: payload.description,
      tax: payload.tax,
      courierFee: payload.courierFee,
      workingHours: payload.workingHours,
      blockedDates: payload.blockedDates,
      totalEmployees: payload.totalEmployees,
      images: payload.images,
    };

    const restaurant = await Restaurant.create(restaurantData);

    // Update user with restaurant ID
    await User.findByIdAndUpdate(user._id, { restaurantId: restaurant._id });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    if (error instanceof Error && error.message.includes('Invalid blocked date')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await mongoConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update restaurants' }, { status: 403 });
    }

    const body = await req.json();
    const payload = sanitizeRestaurantPayload(body, true);
    const { _id, ...updateData } = payload;

    // Validate description length
    if (
      updateData.description &&
      (updateData.description.length < 20 || updateData.description.length > 200)
    ) {
      return NextResponse.json(
        { error: 'Description must be between 20 and 200 characters' },
        { status: 400 }
      );
    }

    if (!updateData.images || !Array.isArray(updateData.images) || updateData.images.length === 0) {
      return NextResponse.json({ error: 'At least one restaurant image is required' }, { status: 400 });
    }

    if (updateData.images.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
    }

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({ _id, ownerId: user._id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or you do not own this restaurant' },
        { status: 404 }
      );
    }

    // Update restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      _id,
      { ...updateData, $unset: { taxRules: '' } },
      {
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({ restaurant: updatedRestaurant }, { status: 200 });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    if (error instanceof Error && error.message.includes('Invalid blocked date')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await mongoConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete restaurants' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId: user._id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or you do not own this restaurant' },
        { status: 404 }
      );
    }

    // Delete restaurant image from Cloudinary if it exists
    if (restaurant.images && Array.isArray(restaurant.images) && restaurant.images.length > 0) {
      const folder =
        process.env.NODE_ENV === 'production' ? 'restaurants-production' : 'restaurants';

      for (const imageUrl of restaurant.images) {
        if (imageUrl && imageUrl.trim() !== '') {
          const matches = imageUrl.match(/restaurants(?:-production)?\/([^\.]+)/);
          const publicId = matches ? `${folder}/${matches[1]}` : null;

          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
              console.log(`Deleted restaurant image from Cloudinary: ${publicId}`);
            } catch (error) {
              console.error(`Error deleting restaurant image from Cloudinary (${publicId}):`, error);
              // Continue with deletion even if image deletion fails
            }
          }
        }
      }
    }

    // Find all menu items belonging to this restaurant
    const menuItems = await MenuItem.find({ restaurantId: restaurantId });

    // Delete images from Cloudinary for each menu item
    for (const menuItem of menuItems) {
      if (menuItem.image) {
        const matches = menuItem.image.match(/menu-items\/([^\.]+)/);
        const publicId = matches ? `menu-items/${matches[1]}` : null;

        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted Cloudinary image: ${publicId}`);
          } catch (error) {
            console.error(`Error deleting image from Cloudinary (${publicId}):`, error);
            // Continue with deletion even if image deletion fails
          }
        }
      }
    }

    // Delete all menu items belonging to this restaurant
    if (menuItems.length > 0) {
      await MenuItem.deleteMany({ restaurantId: restaurantId });
      console.log(`Deleted ${menuItems.length} menu items for restaurant ${restaurantId}`);
    }

    // Delete restaurant
    await Restaurant.findByIdAndDelete(restaurantId);

    // Remove restaurant ID from user
    await User.findByIdAndUpdate(user._id, { restaurantId: null });

    return NextResponse.json(
      {
        message: 'Restaurant deleted successfully',
        deletedMenuItemsCount: menuItems.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
