import { PUT } from '@/app/api/profile/change-password/route';
import { User } from '@/models/user';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    compareSync: vi.fn(),
    genSaltSync: vi.fn(() => 'salt-value'),
    hashSync: vi.fn(() => 'hashed-new-password-value'),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

describe('PUT /api/profile/change-password', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { email: 'john@example.com' } } as never);
  });

  it('returns 401 when there is no session user email', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: {} } as never);

    const request = new Request('http://localhost/api/profile/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'Oldsecret123!',
        newPassword: 'Newsecret123!',
        confirmNewPassword: 'Newsecret123!',
      }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when passwords do not match', async () => {
    const request = new Request('http://localhost/api/profile/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'Oldsecret123!',
        newPassword: 'Newsecret123!',
        confirmNewPassword: 'Anothersecret123!',
      }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Passwords do not match.' });
    expect(User.updateOne).not.toHaveBeenCalled();
  });

  it('returns 400 when the current password is incorrect', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      email: 'john@example.com',
      password: 'stored-password-hash',
    } as never);
    vi.mocked(bcrypt.compareSync).mockReturnValueOnce(false);

    const request = new Request('http://localhost/api/profile/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'Wrongsecret123!',
        newPassword: 'Newsecret123!',
        confirmNewPassword: 'Newsecret123!',
      }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Current password is incorrect' });
    expect(User.updateOne).not.toHaveBeenCalled();
  });

  it('updates the stored password when the current password is valid', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      email: 'john@example.com',
      password: 'stored-password-hash',
    } as never);
    vi.mocked(bcrypt.compareSync).mockReturnValueOnce(true);

    const request = new Request('http://localhost/api/profile/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'Oldsecret123!',
        newPassword: 'Newsecret123!',
        confirmNewPassword: 'Newsecret123!',
      }),
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Password updated successfully' });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(bcrypt.hashSync).toHaveBeenCalledWith('Newsecret123!', 'salt-value');
    expect(User.updateOne).toHaveBeenCalledWith(
      { email: 'john@example.com' },
      { $set: { password: 'hashed-new-password-value' } }
    );
  });
});
