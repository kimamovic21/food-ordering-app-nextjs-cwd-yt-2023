import { POST } from '@/app/api/verify-email/route';
import { User } from '@/models/user';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

describe('POST /api/verify-email', () => {
  it('returns 400 when token is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/verify-email', { method: 'POST' })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Verification token is required' });
  });

  it('verifies a valid token', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({ _id: 'user-id-1' } as never);

    const response = await POST(
      new Request('http://localhost/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Email verified successfully' });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(User.updateOne).toHaveBeenCalled();
  });
});
