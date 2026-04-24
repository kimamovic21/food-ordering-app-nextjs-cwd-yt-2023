import {
  DELETE as DeleteProfile,
  GET as GetProfile,
  PUT as PutProfile,
} from '@/app/api/profile/route';
import { PUT as PutProfilePassword } from '@/app/api/profile/change-password/route';
import { DELETE as DeleteUserImage, POST as UploadUserImage } from '@/app/api/upload/users/route';
import { User } from '@/models/user';
import { getServerSession } from 'next-auth/next';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

type MockSession = { user?: { email?: string } } | null;

let activeSession: MockSession = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(async () => ({ result: 'ok' })),
      upload_stream: vi.fn((_opts, cb) => ({
        end: () =>
          cb(null, {
            secure_url:
              'https://res.cloudinary.com/demo/image/upload/v1/users/e2e-profile-uploaded-image.jpg',
          }),
      })),
    },
  },
}));

const createUser = async (email: string) => {
  return User.create({
    name: 'E2E Profile User',
    email,
    password: 'hashed-password',
    provider: 'credentials',
    phone: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
    role: 'user',
  });
};

describe('E2E Profile: info, image, and account deletion', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await User.deleteMany({ email: /e2e-profile-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-profile-/i });
  });

  it('updates profile info through /api/profile PUT and reads it through GET', async () => {
    const email = `e2e-profile-${Date.now()}@example.com`;
    await createUser(email);
    activeSession = { user: { email } };

    const updateRequest = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe Updated',
        phone: '+38761111222',
        city: 'Sarajevo',
        role: 'admin',
      }),
    });

    const putResponse = await PutProfile(updateRequest);
    expect(putResponse.status).toBe(200);

    const getResponse = await GetProfile();
    const profile = await getResponse.json();

    expect(profile.name).toBe('John Doe Updated');
    expect(profile.phone).toBe('+38761111222');
    expect(profile.city).toBe('Sarajevo');
    expect(profile.role).toBe('user');
  });

  it('changes password through /api/profile/change-password PUT', async () => {
    const email = `e2e-profile-${Date.now()}@example.com`;
    const currentPassword = 'Oldsecret123!';
    const newPassword = 'Newsecret123!';

    await User.create({
      name: 'E2E Profile User',
      email,
      password: bcrypt.hashSync(currentPassword, 10),
      provider: 'credentials',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role: 'user',
    });

    activeSession = { user: { email } };

    const passwordRequest = new Request('http://localhost/api/profile/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      }),
    });

    const passwordResponse = await PutProfilePassword(passwordRequest);
    const passwordBody = await passwordResponse.json();

    expect(passwordResponse.status).toBe(200);
    expect(passwordBody.success).toBe(true);

    const updatedUser = await User.findOne({ email });
    expect(updatedUser?.password).toBeTruthy();
    expect(bcrypt.compareSync(newPassword, updatedUser?.password as string)).toBe(true);
    expect(bcrypt.compareSync(currentPassword, updatedUser?.password as string)).toBe(false);
  });

  it('updates and removes profile image through /api/upload/users routes', async () => {
    const email = `e2e-profile-${Date.now()}@example.com`;
    await createUser(email);
    activeSession = { user: { email } };

    const formData = new FormData();
    formData.append('file', new File(['image-bytes'], 'avatar.png', { type: 'image/png' }));

    const uploadRequest = new Request('http://localhost/api/upload/users', {
      method: 'POST',
      body: formData,
    });

    const uploadResponse = await UploadUserImage(uploadRequest);
    const uploadBody = await uploadResponse.json();

    expect(uploadResponse.status).toBe(200);
    expect(uploadBody.success).toBe(true);

    const userAfterUpload = await User.findOne({ email });
    expect(userAfterUpload?.image).toContain('e2e-profile-uploaded-image.jpg');

    const removeRequest = new Request('http://localhost/api/upload/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: userAfterUpload?.image }),
    });

    const removeResponse = await DeleteUserImage(removeRequest);
    expect(removeResponse.status).toBe(200);

    const userAfterRemove = await User.findOne({ email });
    expect(userAfterRemove?.image).toBe('');
    expect(cloudinary.uploader.destroy).toHaveBeenCalled();
  });

  it('deletes account through /api/profile DELETE', async () => {
    const email = `e2e-profile-${Date.now()}@example.com`;
    await createUser(email);

    await User.updateOne(
      { email },
      {
        $set: {
          image: 'https://res.cloudinary.com/demo/image/upload/v1/users/e2e-delete-image.jpg',
        },
      }
    );

    activeSession = { user: { email } };

    const deleteResponse = await DeleteProfile();
    const body = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(body.success).toBe(true);

    const userAfterDelete = await User.findOne({ email });
    expect(userAfterDelete).toBeNull();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('users/e2e-delete-image');
  });

  it('returns 401 for profile routes when session is missing', async () => {
    activeSession = null;

    const getResponse = await GetProfile();
    expect(getResponse.status).toBe(401);

    const deleteResponse = await DeleteProfile();
    expect(deleteResponse.status).toBe(401);

    const putRequest = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Auth User' }),
    });
    const putResponse = await PutProfile(putRequest);
    expect(putResponse.status).toBe(401);

    expect(getServerSession).toHaveBeenCalled();
  });
});
