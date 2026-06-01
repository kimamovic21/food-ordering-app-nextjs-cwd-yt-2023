import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: { connect: vi.fn() },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

const loadAvailability = async () =>
  (await import('@/app/api/my-delivery/availability/route')).PATCH;
const loadLocation = async () => (await import('@/app/api/my-delivery/location/route')).POST;
const loadGetLocation = async () => (await import('@/app/api/my-delivery/location/route')).GET;

describe('Courier availability and location routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when availability toggled without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);
    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-courier toggles availability', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'a@b.com', role: 'user' },
    } as never);
    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Only couriers can toggle availability' });
  });

  it('toggles availability when courier calls endpoint', async () => {
    const userDoc: any = {
      email: 'c@courier.com',
      availability: false,
      save: vi.fn(async () => {}),
    };
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'c@courier.com', role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(userDoc as never);

    const PATCH = await loadAvailability();
    const res = await PATCH(
      new Request('http://localhost/api/my-delivery/availability', { method: 'PATCH' })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('availability', true);
    expect(userDoc.save).toHaveBeenCalled();
  });

  it('rejects invalid location inputs for courier', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'c@courier.com', role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce({
      email: 'c@courier.com',
      role: 'courier',
      latitude: null,
      longitude: null,
    } as never);

    const POST = await loadLocation();
    const res = await POST(
      new Request('http://localhost/api/my-delivery/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: 'bad', longitude: 10 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('updates location for courier with valid coordinates', async () => {
    const courier = {
      _id: 'cid1',
      email: 'c@courier.com',
      role: 'courier',
      latitude: null,
      longitude: null,
    };
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: courier.email, role: 'courier' },
    } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce(courier as never);
    vi.mocked((await import('@/models/user')).User.findByIdAndUpdate).mockResolvedValueOnce({
      latitude: 45,
      longitude: 15,
      lastLocationUpdate: new Date(),
    } as never);

    const POST = await loadLocation();
    const res = await POST(
      new Request('http://localhost/api/my-delivery/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: 45, longitude: 15 }),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.location.latitude).toBe(45);
  });

  it('returns 403 for GET location when not courier', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'u@x.com', role: 'user' },
    } as never);
    const GET = await loadGetLocation();
    const res = await GET(
      new Request('http://localhost/api/my-delivery/location', { method: 'GET' })
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Only courier can fetch their location' });
  });
});
