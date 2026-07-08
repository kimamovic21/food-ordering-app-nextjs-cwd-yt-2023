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

const loadRoute = async () => await import('@/app/api/notifications/settings/route');

const mockCurrentUser = (overrides: Record<string, unknown> = {}) => {
  const user = {
    _id: 'user-1',
    notificationSoundEnabled: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  vi.mocked(User.findOne).mockReturnValueOnce({
    select: vi.fn().mockResolvedValue(user),
  } as never);

  return user;
};

describe('/api/notifications/settings route', () => {
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

  it('returns the current notification sound setting', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);
    mockCurrentUser({ notificationSoundEnabled: true });

    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(body).toEqual({ notificationSoundEnabled: true });
  });

  it('updates the current notification sound setting', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);
    const user = mockCurrentUser();

    const { PATCH } = await loadRoute();
    const res = await PATCH(
      new Request('http://localhost/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationSoundEnabled: true }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(user.notificationSoundEnabled).toBe(true);
    expect(user.save).toHaveBeenCalled();
    expect(body).toEqual({ success: true, notificationSoundEnabled: true });
  });
});
