import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function PATCH(_req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userRole = (session.user as any).role;

    if (userRole !== 'courier') {
      return Response.json(
        { error: 'Only couriers can toggle availability' },
        { status: 403 }
      );
    }

    // Fetch current user to get current availability
    const currentUser = await User.findOne({ email: userEmail });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Toggle availability
    const newAvailability = !currentUser.availability;
    currentUser.availability = newAvailability;
    await currentUser.save();

    return Response.json({
      availability: newAvailability,
      message: newAvailability ? 'You are now online' : 'You are now offline',
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    return Response.json(
      { error: 'Failed to toggle availability' },
      { status: 500 }
    );
  }
}
