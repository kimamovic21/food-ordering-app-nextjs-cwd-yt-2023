import { User } from '@/models/user';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import client from '@/libs/mongoConnect';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(client),
  allowDangerousEmailAccountLinking: true,
  session: { strategy: 'jwt' as const },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      id: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'test@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        await mongoose.connect(process.env.MONGODB_URL as string);
        const user = await User.findOne({ email });

        if (!user?.password) return null;

        const passwordOk = bcrypt.compareSync(password, user.password);

        if (!passwordOk) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || '',
          phone: user.phone || '',
          streetAddress: user.streetAddress || '',
          postalCode: user.postalCode || '',
          city: user.city || '',
          country: user.country || '',
          admin: user.admin || false,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session }: { session: any }) {
      if (!session?.user?.email) return session;

      await mongoose.connect(process.env.MONGODB_URL as string);
      const userInDb = await User.findOne({ email: session.user.email });

      if (userInDb) {
        session.user.name = userInDb.name;
        session.user.image = userInDb.image;
        session.user.phone = userInDb.phone || '';
        session.user.streetAddress = userInDb.streetAddress || '';
        session.user.postalCode = userInDb.postalCode || '';
        session.user.city = userInDb.city || '';
        session.user.country = userInDb.country || '';
        session.user.admin = userInDb.admin || false;
      }

      return session;
    },

    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = (user as any)._id;
        token.phone = (user as any).phone || '';
        token.streetAddress = (user as any).streetAddress || '';
        token.postalCode = (user as any).postalCode || '';
        token.city = (user as any).city || '';
        token.country = (user as any).country || '';
        token.admin = (user as any).admin || false;
      };

      return token;
    },
  },

  async signIn({
    user,
    account,
  }: {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      [key: string]: any
    }
    account?: {
      provider?: string
      [key: string]: any
    }
  }) {
    if (account?.provider === 'google') {
      await mongoose.connect(process.env.MONGODB_URL as string);
      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        existingUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image || '',
          provider: 'google',
          phone: '',
          streetAddress: '',
          postalCode: '',
          city: '',
          country: '',
          admin: false,
        });
      };
    };

    return true;
  },
};