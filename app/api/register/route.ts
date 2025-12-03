import { User } from '@/models/user';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  const body = await req.json();

  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is not defined in environment variables!');
  };

  await mongoose.connect(process.env.MONGODB_URL as string);

  const newUser = await User.create(body);

  return Response.json(newUser);
};