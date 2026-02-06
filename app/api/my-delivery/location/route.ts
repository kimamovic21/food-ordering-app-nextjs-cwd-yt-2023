import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

const MAX_DISTANCE_KM = 50; // Maximum distance in km to validate location updates

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
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
}

export async function POST(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const user = await User.findOne({ email: userEmail });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only courier can update location' }, { status: 403 });
  }

  try {
    const { latitude, longitude } = await request.json();

    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return Response.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return Response.json({ error: 'Invalid latitude or longitude format' }, { status: 400 });
    }

    // Validate coordinates are within valid ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Validate distance from previous location (prevent unrealistic jumps)
    if (user.latitude !== null && user.longitude !== null) {
      const distance = calculateDistance(user.latitude, user.longitude, latitude, longitude);

      if (distance > MAX_DISTANCE_KM) {
        return Response.json(
          {
            error: `Location update rejected: too far from previous location (${distance.toFixed(
              2
            )}km)`,
          },
          { status: 400 }
        );
      }
    }

    // Update courier location
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        latitude,
        longitude,
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );

    return Response.json({
      message: 'Location updated successfully',
      location: {
        latitude: updatedUser?.latitude,
        longitude: updatedUser?.longitude,
        lastLocationUpdate: updatedUser?.lastLocationUpdate,
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return Response.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function GET(_request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email;
  const user = await User.findOne({ email: userEmail });

  if (!user || user.role !== 'courier') {
    return Response.json({ error: 'Only courier can fetch their location' }, { status: 403 });
  }

  // Ensure fields exist even if not in document
  const latitude = user.latitude ?? null;
  const longitude = user.longitude ?? null;
  const lastLocationUpdate = user.lastLocationUpdate ?? null;

  return Response.json({
    location: {
      latitude,
      longitude,
      lastLocationUpdate,
    },
  });
}
