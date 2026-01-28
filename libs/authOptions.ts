import { User } from '@/models/user';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { mongoConnect } from '@/libs/mongoConnect';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Use a dedicated database for NextAuth to avoid collection conflicts
const mongoAdapter = MongoDBAdapter(mongoConnect, { databaseName: 'next-auth' });

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: mongoAdapter,
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
          role: user.role || 'user',
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      // Allow all sign-ins; adapter handles account linking
      return true;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (!session?.user?.email) return session;

      // First, copy role from token if available
      if (token?.role) {
        session.user.role = token.role;
      }

      // Then fetch fresh data from database; create user if missing
      try {
        await mongoose.connect(process.env.MONGODB_URL as string);
        let userInDb = await User.findOne({ email: session.user.email });

        if (userInDb) {
          session.user.name = userInDb.name;
          session.user.image = userInDb.image;
          session.user.phone = userInDb.phone || '';
          session.user.streetAddress = userInDb.streetAddress || '';
          session.user.postalCode = userInDb.postalCode || '';
          session.user.city = userInDb.city || '';
          session.user.country = userInDb.country || '';
          session.user.role = userInDb.role || 'user';
        } else {
          // Create the user in our app DB on first OAuth session
          try {
            // Check if this is the first user in the database
            const userCount = await User.countDocuments();
            const role = userCount === 0 ? 'admin' : token?.role || 'user';
            userInDb = await User.create({
              name: session.user.name || 'User',
              email: session.user.email,
              image: session.user.image || '',
              provider: 'oauth',
              phone: '',
              streetAddress: '',
              postalCode: '',
              city: '',
              country: '',
              role,
              availability: false,
              takenOrder: null,
              latitude: null,
              longitude: null,
              lastLocationUpdate: null,
            });

            // Mirror data back into session
            session.user.name = userInDb.name;
            session.user.image = userInDb.image;
            session.user.role = userInDb.role || 'user';
          } catch (createErr) {
            console.error('Error creating user on session:', createErr);
          }
        }
      } catch (error) {
        console.error('Error in session callback:', error);
      }

      return session;
    },

    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = (user as any)._id;
        token.email = (user as any).email;
        token.phone = (user as any).phone || '';
        token.streetAddress = (user as any).streetAddress || '';
        token.postalCode = (user as any).postalCode || '';
        token.city = (user as any).city || '';
        token.country = (user as any).country || '';
        token.role = (user as any).role || 'user';
      } else if (token.email) {
        // Refresh user data from database on each JWT callback
        try {
          await mongoose.connect(process.env.MONGODB_URL as string);
          const userInDb = await User.findOne({ email: token.email });
          if (userInDb) {
            token.role = userInDb.role || 'user';
            token.phone = userInDb.phone || '';
            token.streetAddress = userInDb.streetAddress || '';
            token.postalCode = userInDb.postalCode || '';
            token.city = userInDb.city || '';
            token.country = userInDb.country || '';
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
        }
      }

      return token;
    },
  },

  // Use events to synchronize NextAuth users with our Mongoose User model
  events: {
    async createUser({ user }: any) {
      try {
        await mongoose.connect(process.env.MONGODB_URL as string);
        const existing = await User.findOne({ email: user?.email });
        if (!existing && user?.email) {
          // Check if this is the first user in the database
          const userCount = await User.countDocuments();
          const role = userCount === 0 ? 'admin' : 'user';
          await User.create({
            name: user?.name || '',
            email: user.email,
            image: user?.image || '',
            provider: 'oauth',
            phone: '',
            streetAddress: '',
            postalCode: '',
            city: '',
            country: '',
            role,
            availability: false,
            takenOrder: null,
          });
        }
      } catch (err) {
        console.error('Error in events.createUser:', err);
      }
    },

    async linkAccount({ user, account }: any) {
      try {
        if (account?.provider === 'google' && user?.email) {
          await mongoose.connect(process.env.MONGODB_URL as string);
          await User.findOneAndUpdate(
            { email: user.email },
            {
              name: user.name,
              image: user.image,
              provider: 'oauth',
            }
          );
        }
      } catch (err) {
        console.error('Error in events.linkAccount:', err);
      }
    },
  },
};
