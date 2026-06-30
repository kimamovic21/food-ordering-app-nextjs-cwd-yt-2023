import { User } from '@/models/user';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import mongoClientPromise from '@/libs/mongodbClient';
import { isSkipVerifyEmail } from '@/libs/authEmails';
import { createRateLimitKey, enforceRateLimit, getClientIp } from '@/libs/rateLimit';

// Use a dedicated database for NextAuth to avoid collection conflicts
const mongoAdapter = MongoDBAdapter(mongoClientPromise, { databaseName: 'next-auth' });
const DEFAULT_PROFILE_IMAGE = '/user-default-image.webp';

const isRealProfileImage = (image?: string | null) =>
  Boolean(image && image.trim() && image !== DEFAULT_PROFILE_IMAGE);

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: mongoAdapter,
  allowDangerousEmailAccountLinking: true,
  session: { strategy: 'jwt' as const },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
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
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const rateLimit = await enforceRateLimit({
          identifier: createRateLimitKey('login', getClientIp(request), email),
          limit: 10,
          namespace: 'auth-login',
          window: '1 m',
        });

        if (!rateLimit.success) {
          throw new Error('RATE_LIMITED');
        }

        await mongoose.connect(process.env.MONGODB_URL as string);
        const user = await User.findOne({ email });

        if (!user?.password) return null;

        if (user.provider === 'credentials' && !user.emailVerifiedAt && !isSkipVerifyEmail()) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        const passwordOk = bcrypt.compareSync(password, user.password);

        if (!passwordOk) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || '',
          provider: user.provider || 'credentials',
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
      const googleProfileImage =
        (isRealProfileImage(token?.picture) && token.picture) ||
        (isRealProfileImage(token?.image) && token.image) ||
        (isRealProfileImage(session.user.image) && session.user.image) ||
        '';

      // First, copy role from token if available
      if (token?.role) {
        session.user.role = token.role;
      }

      // Then fetch fresh data from database; create user if missing
      try {
        await mongoose.connect(process.env.MONGODB_URL as string);
        let userInDb = await User.findOne({ email: session.user.email });

        if (userInDb) {
          const dbProfileImage = isRealProfileImage(userInDb.image) ? userInDb.image : '';
          const resolvedProfileImage = dbProfileImage || googleProfileImage || '';

          if (!dbProfileImage && googleProfileImage) {
            await User.updateOne({ _id: userInDb._id }, { $set: { image: googleProfileImage } });
          }

          session.user.name = userInDb.name;
          session.user.image = resolvedProfileImage;
          session.user.provider = userInDb.provider || 'credentials';
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
              image: googleProfileImage || session.user.image || '',
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
              restaurantId: null,
              emailVerifiedAt: new Date(),
            });

            // Mirror data back into session
            session.user.name = userInDb.name;
            session.user.image = userInDb.image;
            session.user.provider = userInDb.provider || 'oauth';
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

    async jwt({ token, user, profile }: { token: any; user?: any; profile?: any }) {
      const googleProfileImage =
        (isRealProfileImage(profile?.picture) && profile.picture) ||
        (isRealProfileImage((profile as any)?.image) && (profile as any).image) ||
        (isRealProfileImage(token?.picture) && token.picture) ||
        (isRealProfileImage(token?.image) && token.image) ||
        '';

      if (user) {
        token.id = (user as any)._id;
        token.email = (user as any).email;
        token.image =
          (isRealProfileImage((user as any).image) && (user as any).image) ||
          googleProfileImage ||
          '';
        token.picture = token.image;
        token.provider = (user as any).provider || 'credentials';
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
            token.provider = userInDb.provider || 'credentials';
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
            restaurantId: null,
            emailVerifiedAt: new Date(),
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
