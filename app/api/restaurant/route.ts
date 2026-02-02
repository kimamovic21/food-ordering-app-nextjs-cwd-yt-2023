import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/libs/authOptions';
import { mongoConnect } from '@/libs/mongoConnect';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';

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
    const restaurant = await Restaurant.findOne({ ownerId: user._id });

    if (!restaurant) {
      return NextResponse.json({ restaurant: null }, { status: 200 });
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

    // Validate description length
    if (body.description && (body.description.length < 20 || body.description.length > 200)) {
      return NextResponse.json(
        { error: 'Description must be between 20 and 200 characters' },
        { status: 400 }
      );
    }

    // Create restaurant
    const restaurant = await Restaurant.create({
      ...body,
      ownerId: user._id,
    });

    // Update user with restaurant ID
    await User.findByIdAndUpdate(user._id, { restaurantId: restaurant._id });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
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
    const { _id, ...updateData } = body;

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

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({ _id, ownerId: user._id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or you do not own this restaurant' },
        { status: 404 }
      );
    }

    // Update restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ restaurant: updatedRestaurant }, { status: 200 });
  } catch (error) {
    console.error('Error updating restaurant:', error);
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

    // Delete restaurant
    await Restaurant.findByIdAndDelete(restaurantId);

    // Remove restaurant ID from user
    await User.findByIdAndUpdate(user._id, { restaurantId: null });

    return NextResponse.json({ message: 'Restaurant deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
