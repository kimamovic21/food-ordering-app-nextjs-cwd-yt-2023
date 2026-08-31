import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const createMongoMemoryTestServer = async () => {
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();

  await mongoose.connect(uri);

  return {
    uri,
    server,
    stop: async () => {
      await mongoose.disconnect();
      await server.stop();
    },
  };
};
