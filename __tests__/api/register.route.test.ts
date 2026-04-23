import { POST } from '@/app/api/register/route';
import { User } from '@/models/user';
import { authMockUsers } from '@/mocks/auth/users';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    genSaltSync: vi.fn(() => 'salt-value'),
    hashSync: vi.fn(() => 'hashed-password-value'),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

describe('POST /api/register', () => {
  it('returns 400 when password is too short', async () => {
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...authMockUsers.registerInput,
        password: '1234',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Password must be at least 5 characters!' });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('returns 400 when email already exists', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(authMockUsers.existingUser as never);

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authMockUsers.registerInput),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Email already exists' });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('creates the first user as admin', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);
    vi.mocked(User.countDocuments).mockResolvedValueOnce(0);
    vi.mocked(User.create).mockResolvedValueOnce(authMockUsers.createdAdmin as never);

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authMockUsers.registerInput),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(authMockUsers.createdAdmin);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
    expect(bcrypt.hashSync).toHaveBeenCalledWith(
      authMockUsers.registerInput.password,
      'salt-value'
    );
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'admin',
        provider: 'credentials',
      })
    );
  });

  it('creates subsequent users with user role', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);
    vi.mocked(User.countDocuments).mockResolvedValueOnce(5);
    vi.mocked(User.create).mockResolvedValueOnce(authMockUsers.createdUser as never);

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'MYsecret123!',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
      })
    );
  });
});
