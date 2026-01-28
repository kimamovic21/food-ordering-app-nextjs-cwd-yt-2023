import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL as string;

if (!MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function mongoConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URL).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
