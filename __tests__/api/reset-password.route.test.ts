import { POST } from '@/app/api/reset-password/route';
import { User } from '@/models/user';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    genSaltSync: vi.fn(() => 'salt-value'),
    hashSync: vi.fn(() => 'hashed-reset-password-value'),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

describe('POST /api/reset-password', () => {
  it('returns 400 when passwords do not match', async () => {
    const response = await POST(
      new Request('http://localhost/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'token-value',
          newPassword: 'Newsecret123!',
          confirmNewPassword: 'Othersecret123!',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Passwords do not match.' });
  });

  it('updates the password for a valid credentials account', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: 'user-id-1',
      provider: 'credentials',
      password: 'hash',
    } as never);

    const response = await POST(
      new Request('http://localhost/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'token-value',
          newPassword: 'Newsecret123!',
          confirmNewPassword: 'Newsecret123!',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Password reset successfully' });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
    expect(User.updateOne).toHaveBeenCalled();
  });
});
