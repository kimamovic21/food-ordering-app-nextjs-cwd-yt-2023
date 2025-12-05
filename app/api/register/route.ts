import { User } from '@/models/user';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const body = await req.json();

  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is not defined in environment variables!');
  };

  await mongoose.connect(process.env.MONGODB_URL as string);

  const pass = body.password;

  if (!pass?.length || pass.length < 5) {
    new Error('Password must be at least 5 characters!');
    return false;
  };

  const notHashedPassword = pass;
  const salt = bcrypt.genSaltSync(10);
  body.password = bcrypt.hashSync(notHashedPassword, salt);

  const createdUser = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    provider: 'credentials',
    phone: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
  });

  return Response.json(createdUser);
};