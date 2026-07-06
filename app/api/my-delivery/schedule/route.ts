import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { normalizeCourierWorkingHours, validateCourierWorkingHours } from '@/libs/courierSchedule';
import { User } from '@/models/user';

const getCourier = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user || user.role !== 'courier') {
    return {
      error: Response.json({ error: 'Only couriers can manage their schedule' }, { status: 403 }),
    };
  }

  return { user };
};

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const { user, error } = await getCourier();
    if (error) return error;

    return Response.json({
      workingHours: normalizeCourierWorkingHours(user.courierWorkingHours),
    });
  } catch (error) {
    console.error('Error fetching courier schedule:', error);
    return Response.json({ error: 'Failed to fetch courier schedule' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const { user, error } = await getCourier();
    if (error) return error;

    const body = await request.json().catch(() => null);
    const validationError = validateCourierWorkingHours(body?.workingHours);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    user.courierWorkingHours = normalizeCourierWorkingHours(body.workingHours);
    await user.save();

    return Response.json({
      workingHours: user.courierWorkingHours,
      message: 'Courier schedule updated',
    });
  } catch (error) {
    console.error('Error updating courier schedule:', error);
    return Response.json({ error: 'Failed to update courier schedule' }, { status: 500 });
  }
}
