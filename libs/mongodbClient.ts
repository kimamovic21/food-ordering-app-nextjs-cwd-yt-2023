import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL as string;

if (!MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URL);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URL);
  clientPromise = client.connect();
}

export default clientPromise;
