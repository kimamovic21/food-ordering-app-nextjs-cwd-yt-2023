import { User } from '@/models/user';
import { authOptions } from '@/libs/authOptions';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

vi.mock('@auth/mongodb-adapter', () => ({
  MongoDBAdapter: vi.fn(() => ({})),
}));

vi.mock('@/libs/mongodbClient', () => ({
  default: Promise.resolve({}),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ id: 'google' })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((config: unknown) => ({
    id: 'credentials',
    ...(config as Record<string, unknown>),
  })),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compareSync: vi.fn(),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

const getAuthorize = () => {
  const credentialsProvider = authOptions.providers.find(
    (provider: { id?: string }) => provider.id === 'credentials'
  );
  if (!credentialsProvider || typeof credentialsProvider.authorize !== 'function') {
    throw new Error('Credentials authorize handler not found');
  }

  return credentialsProvider.authorize;
};

describe('Credentials authorize', () => {
  it('returns null when credentials are missing', async () => {
    const authorize = getAuthorize();

    await expect(authorize({ email: '', password: '' })).resolves.toBeNull();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('returns null when user does not exist', async () => {
    const authorize = getAuthorize();
    vi.mocked(User.findOne).mockResolvedValueOnce(null);

    const result = await authorize({
      email: 'john.doe@example.com',
      password: 'MYsecret123!',
    });

    expect(result).toBeNull();
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });

  it('returns null for invalid password', async () => {
    const authorize = getAuthorize();

    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: 'u1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'stored-hash',
      role: 'user',
    } as never);
    vi.mocked(bcrypt.compareSync).mockReturnValueOnce(false);

    const result = await authorize({
      email: 'john.doe@example.com',
      password: 'wrong-password',
    });

    expect(result).toBeNull();
    expect(bcrypt.compareSync).toHaveBeenCalledWith('wrong-password', 'stored-hash');
  });

  it('returns user payload for valid credentials', async () => {
    const authorize = getAuthorize();

    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: 'u2',
      name: 'John Doe',
      email: 'john.doe@example.com',
      image: '',
      password: 'stored-hash',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role: 'admin',
    } as never);
    vi.mocked(bcrypt.compareSync).mockReturnValueOnce(true);

    const result = await authorize({
      email: 'john.doe@example.com',
      password: 'MYsecret123!',
    });

    expect(result).toEqual({
      id: 'u2',
      name: 'John Doe',
      email: 'john.doe@example.com',
      image: '',
      provider: 'credentials',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role: 'admin',
    });
  });
});
