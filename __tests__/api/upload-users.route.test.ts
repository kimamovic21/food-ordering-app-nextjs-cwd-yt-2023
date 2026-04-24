import { DELETE, POST } from '@/app/api/upload/users/route';
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
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

const setupUploadStreamSuccess = (url: string) => {
  vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((_opts, cb) => {
    return {
      end: () => cb(null, { secure_url: url }),
    } as never;
  });
};

describe('/api/upload/users route handlers', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(
      { user: { email: profileMockUsers.sessionEmail } } as never
    );
  });

  it('returns 401 when POST is called without session email', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: {} } as never);

    const request = new Request('http://localhost/api/upload/users', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 when POST has no file', async () => {
    const request = new Request('http://localhost/api/upload/users', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('uploads image, removes previous one, and stores new image url', async () => {
    setupUploadStreamSuccess(
      profileMockUsers.uploadUpdatedImageUser.image
    );

    vi.mocked(User.findOne).mockResolvedValueOnce(profileMockUsers.uploadExistingImageUser as never);

    vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(
      profileMockUsers.uploadUpdatedImageUser as never
    );

    const formData = new FormData();
    formData.append('file', new File(['hello'], 'avatar.png', { type: 'image/png' }));

    const request = new Request('http://localhost/api/upload/users', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('users/old-profile');
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { email: profileMockUsers.sessionEmail },
      { image: profileMockUsers.uploadUpdatedImageUser.image },
      { new: true }
    );
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toBe(profileMockUsers.uploadUpdatedImageUser.image);
  });

  it('deletes image reference from user on DELETE', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({ email: profileMockUsers.sessionEmail } as never);
    vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(profileMockUsers.removeImageUser as never);

    const request = new Request('http://localhost/api/upload/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/users/profile-remove.jpg',
      }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('users/profile-remove');
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { email: profileMockUsers.sessionEmail },
      { image: '' },
      { new: true }
    );
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
