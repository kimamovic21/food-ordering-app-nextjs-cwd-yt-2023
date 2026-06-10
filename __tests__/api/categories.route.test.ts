import mongoose from 'mongoose';
import { isSuperAdmin } from '@/app/api/auth/[...nextauth]/route';
import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';
import cloudinary from '@/libs/cloudinary';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isSuperAdmin: vi.fn(),
}));

vi.mock('@/models/category', () => ({
  Category: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(),
    },
  },
}));

const loadCategoriesRoute = async () => import('@/app/api/categories/route');

const jsonRequest = (method: string, body: Record<string, unknown>) =>
  new Request('http://localhost/api/categories', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/categories route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
    vi.mocked(isSuperAdmin).mockResolvedValue(true as never);
  });

  it('blocks category creation for non-super-admin users', async () => {
    vi.mocked(isSuperAdmin).mockResolvedValueOnce(false as never);

    const { POST } = await loadCategoriesRoute();
    const res = await POST(jsonRequest('POST', { name: 'Pizza' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Only super admin can create categories' });
    expect(Category.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate category names', async () => {
    vi.mocked(Category.findOne).mockResolvedValueOnce({
      _id: 'category-1',
      name: 'Pizza',
    } as never);

    const { POST } = await loadCategoriesRoute();
    const res = await POST(jsonRequest('POST', { name: 'Pizza' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'A category with that name already exists.' });
    expect(Category.create).not.toHaveBeenCalled();
  });

  it('creates a category for super admins', async () => {
    vi.mocked(Category.findOne).mockResolvedValueOnce(null as never);
    vi.mocked(Category.create).mockResolvedValueOnce({ _id: 'category-1', name: 'Pizza' } as never);

    const { POST } = await loadCategoriesRoute();
    const res = await POST(jsonRequest('POST', { name: 'Pizza' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ _id: 'category-1', name: 'Pizza' });
    expect(Category.create).toHaveBeenCalledWith({ name: 'Pizza' });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });

  it('returns categories sorted by name', async () => {
    const sortedCategories = [
      { _id: 'category-1', name: 'Burgers' },
      { _id: 'category-2', name: 'Pizza' },
    ];
    const sort = vi.fn().mockResolvedValue(sortedCategories);
    vi.mocked(Category.find).mockReturnValueOnce({ sort } as never);

    const { GET } = await loadCategoriesRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(sortedCategories);
    expect(sort).toHaveBeenCalledWith({ name: 1 });
  });

  it('updates category names for super admins', async () => {
    vi.mocked(Category.findByIdAndUpdate).mockResolvedValueOnce({
      _id: 'category-1',
      name: 'Pasta',
    } as never);

    const { PUT } = await loadCategoriesRoute();
    const res = await PUT(jsonRequest('PUT', { _id: 'category-1', name: 'Pasta' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ _id: 'category-1', name: 'Pasta' });
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
      'category-1',
      { name: 'Pasta' },
      { new: true }
    );
  });

  it('deletes category menu items and cleans up Cloudinary images', async () => {
    vi.mocked(MenuItem.find).mockResolvedValueOnce([
      {
        image: 'https://res.cloudinary.com/demo/image/upload/v123/menu-items/pizza.jpg',
      },
      {
        image: 'https://res.cloudinary.com/demo/image/upload/menu-items/pasta.png',
      },
      {
        image: '',
      },
    ] as never);
    vi.mocked(Category.findByIdAndDelete).mockResolvedValueOnce({
      _id: 'category-1',
      name: 'Pizza',
    } as never);

    const { DELETE } = await loadCategoriesRoute();
    const res = await DELETE(jsonRequest('DELETE', { _id: 'category-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ _id: 'category-1', name: 'Pizza' });
    expect(MenuItem.find).toHaveBeenCalledWith({ category: 'category-1' });
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('menu-items/pizza');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('menu-items/pasta');
    expect(MenuItem.deleteMany).toHaveBeenCalledWith({ category: 'category-1' });
    expect(Category.findByIdAndDelete).toHaveBeenCalledWith('category-1');
  });
});
