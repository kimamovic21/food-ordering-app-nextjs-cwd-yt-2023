import { DELETE, GET, PUT } from '@/app/api/profile/route';
import { User } from '@/models/user';
import { profileMockUsers } from '@/mocks/profile/users';
import { getServerSession } from 'next-auth/next';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(),
    },
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    updateOne: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

describe('/api/profile route handlers', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(
      { user: { email: profileMockUsers.sessionEmail } } as never
    );
  });

  it('returns 401 when GET is called without session user email', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: {} } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('updates only allowed profile fields on PUT', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(profileMockUsers.updatedProfile as never);

    const request = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileMockUsers.updatedProfile.name,
        phone: profileMockUsers.updatedProfile.phone,
        city: profileMockUsers.updatedProfile.city,
        role: 'admin',
      }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(User.updateOne).toHaveBeenCalledWith(
      { email: profileMockUsers.sessionEmail },
      {
        $set: {
          name: profileMockUsers.updatedProfile.name,
          phone: profileMockUsers.updatedProfile.phone,
          city: profileMockUsers.updatedProfile.city,
        },
      }
    );

    const body = await response.json();
    expect(body.name).toBe(profileMockUsers.updatedProfile.name);
  });

  it('returns 404 when DELETE is called for non-existent user', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
    expect(User.deleteOne).not.toHaveBeenCalled();
  });

  it('deletes user and cloudinary image on DELETE when image exists', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(
      profileMockUsers.profileDeleteUserWithImage as never
    );

    const response = await DELETE();
    const body = await response.json();

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('users/profile-image-1');
    expect(User.deleteOne).toHaveBeenCalledWith({ email: profileMockUsers.sessionEmail });
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Account deleted successfully' });
  });
});
