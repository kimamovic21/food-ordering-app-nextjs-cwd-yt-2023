import { POST } from '@/app/api/register/route';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const getAuthorize = () => {
  const credentialsProvider = authOptions.providers.find(
    (provider: { id?: string; authorize?: unknown }) => provider.id === 'credentials'
  );

  if (!credentialsProvider) {
    throw new Error('Credentials authorize handler not found');
  }

  const authorizeFromProvider = (credentialsProvider as { authorize?: unknown }).authorize;
  const authorizeFromOptions = (credentialsProvider as { options?: { authorize?: unknown } })
    .options?.authorize;

  const authorize =
    typeof authorizeFromOptions === 'function'
      ? authorizeFromOptions
      : typeof authorizeFromProvider === 'function'
        ? authorizeFromProvider
        : null;

  if (!authorize) {
    throw new Error('Credentials authorize function is missing');
  }

  return authorize as (credentials: {
    email: string;
    password: string;
  }) => Promise<null | Record<string, unknown>>;
};

const createRegisterRequest = (name: string, email: string, password: string) =>
  new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

describe('E2E Auth: register and login', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /e2e-auth-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-auth-/i });
  });

  it('registers a user and stores hashed password in database', async () => {
    const email = `e2e-auth-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    const response = await POST(createRegisterRequest('John Doe', email, password));
    expect(response.status).toBe(201);

    const userInDb = await User.findOne({ email });

    expect(userInDb).toBeTruthy();
    expect(userInDb?.password).toBeTruthy();
    expect(userInDb?.password).not.toBe(password);
    expect(bcrypt.compareSync(password, userInDb?.password || '')).toBe(true);
  });

  it('logs in with valid credentials through credentials authorize', async () => {
    const email = `e2e-auth-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    const registerResponse = await POST(createRegisterRequest('John Doe', email, password));
    expect(registerResponse.status).toBe(201);

    const persistedUser = await User.findOne({ email });
    expect(persistedUser).toBeTruthy();
    expect(persistedUser?.password).toBeTruthy();
    expect(bcrypt.compareSync(password, persistedUser?.password || '')).toBe(true);

    // Verify the user's email since email verification is now required
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    const authorize = getAuthorize();
    const authResult = await authorize({ email, password });

    expect(authResult).toBeTruthy();
    expect(authResult?.email).toBe(email);
    expect(authResult?.name).toBe('John Doe');
  });

  it('rejects duplicate email registration', async () => {
    const email = `e2e-auth-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    const firstResponse = await POST(createRegisterRequest('John Doe', email, password));
    expect(firstResponse.status).toBe(201);

    const secondResponse = await POST(createRegisterRequest('John Doe', email, password));
    const body = await secondResponse.json();

    expect(secondResponse.status).toBe(400);
    expect(body).toEqual({ error: 'Email already exists' });
  });
});
