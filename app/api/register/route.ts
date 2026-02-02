import { User } from '@/models/user';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is not defined in environment variables!');
    }

    await mongoose.connect(process.env.MONGODB_URL as string);

    const pass = body.password;

    if (!pass || pass.length < 5) {
      return Response.json({ error: 'Password must be at least 5 characters!' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(pass, salt);

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const createdUser = await User.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      provider: 'credentials',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role,
      availability: false,
      takenOrder: null,
      restaurantId: null,
    });

    return Response.json(createdUser, { status: 201 });
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
