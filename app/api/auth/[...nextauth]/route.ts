import { User } from '@/models/user';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import client from '@/libs/mongoConnect';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      id: 'credentials',
      credentials: {
        username: {
          label: 'Email',
          type: 'email',
          placeholder: 'test@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials, req) {
        const email = credentials?.username;
        const password = credentials?.password;

        await mongoose.connect(process.env.MONGODB_URL as string);

        const user = await User.findOne({ email });
        const passwordOk = user && bcrypt.compareSync(
          password ?? '', user.password
        );

        if (passwordOk) {
          return user;
        };

        return null;
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};