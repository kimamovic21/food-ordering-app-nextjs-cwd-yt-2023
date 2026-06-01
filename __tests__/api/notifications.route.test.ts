import { getServerSession } from 'next-auth/next';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn(() => true),
      },
    },
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

vi.mock('@/models/notification', () => ({
  Notification: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    updateMany: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

const loadRoute = async () => await import('@/app/api/notifications/route');

describe('/api/notifications route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when session is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/notifications'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns notifications and unread count for the current user', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);

    const userFindOne = vi.mocked((await import('@/models/user')).User.findOne);
    userFindOne.mockReturnValueOnce({
      select: vi
        .fn()
        .mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'user-1', role: 'user' }) }),
    } as never);

    const notificationFind = vi.mocked((await import('@/models/notification')).Notification.find);
    notificationFind.mockReturnValueOnce({
      sort: vi
        .fn()
        .mockReturnValue({
          skip: vi
            .fn()
            .mockReturnValue({
              limit: vi
                .fn()
                .mockReturnValue({ lean: vi.fn().mockResolvedValue([{ _id: 'n1', title: 'A' }]) }),
            }),
        }),
    } as never);
    vi.mocked(
      (await import('@/models/notification')).Notification.countDocuments
    ).mockResolvedValueOnce(2 as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/notifications?limit=5&skip=0'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.unreadCount).toBe(2);
    expect(body.notifications).toHaveLength(1);
  });

  it('marks notification as read for current user', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    } as never);

    const userFindOne = vi.mocked((await import('@/models/user')).User.findOne);
    userFindOne.mockReturnValueOnce({
      select: vi
        .fn()
        .mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'user-1', role: 'user' }) }),
    } as never);

    vi.mocked(
      (await import('@/models/notification')).Notification.findOneAndUpdate
    ).mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: 'n1' }) } as never);
    vi.mocked(
      (await import('@/models/notification')).Notification.countDocuments
    ).mockResolvedValueOnce(0 as never);

    const { PATCH } = await loadRoute();
    const res = await PATCH(
      new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', notificationId: '507f1f77bcf86cd799439011' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
