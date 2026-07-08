import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { User } from '@/models/user';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

const loadRoute = async () => await import('@/app/api/messages/settings/route');

const mockCurrentUser = (overrides: Record<string, unknown> = {}) => {
  const user = {
    _id: 'user-1',
    messageSoundEnabled: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  vi.mocked(User.findOne).mockReturnValueOnce({
    select: vi.fn().mockResolvedValue(user),
  } as never);

  return user;
};

describe('/api/messages/settings route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when session is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns the current message sound setting', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);
    mockCurrentUser({ messageSoundEnabled: true });

    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(body).toEqual({ messageSoundEnabled: true });
  });

  it('updates the current message sound setting', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);
    const user = mockCurrentUser();

    const { PATCH } = await loadRoute();
    const res = await PATCH(
      new Request('http://localhost/api/messages/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageSoundEnabled: true }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(user.messageSoundEnabled).toBe(true);
    expect(user.save).toHaveBeenCalled();
    expect(body).toEqual({ success: true, messageSoundEnabled: true });
  });
});
