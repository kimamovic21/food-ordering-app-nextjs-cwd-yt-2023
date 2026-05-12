import { POST } from '@/app/api/forgot-password/route';
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

describe('POST /api/forgot-password', () => {
  it('returns the google sign-in message for oauth accounts', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({ provider: 'oauth' } as never);

    const response = await POST(
      new Request('http://localhost/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.canResetPassword).toBe(false);
    expect(body.message).toMatch(/Google sign-in/i);
  });

  it('creates a reset token for credentials accounts', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      provider: 'credentials',
      password: 'hash',
    } as never);

    const response = await POST(
      new Request('http://localhost/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(User.updateOne).toHaveBeenCalled();
  });
});
