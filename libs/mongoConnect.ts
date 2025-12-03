import { MongoClient, ServerApiVersion } from 'mongodb'

const MONGODB_URL = process.env.MONGODB_URL as string;

if (!process.env.MONGODB_URL) {
  throw new Error(`Invalid/Missing environment variable: ${MONGODB_URL}`);
};

const uri = process.env.MONGODB_URL
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  };

  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri, options);
};

export default client;