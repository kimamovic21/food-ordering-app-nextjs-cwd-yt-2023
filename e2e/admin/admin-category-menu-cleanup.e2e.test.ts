import mongoose from 'mongoose';
import { Category } from '@/models/category';
import { MenuItem } from '@/models/menuItem';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import cloudinary from '@/libs/cloudinary';

let activeSession: any = null;

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(async () => activeSession?.user?.role === 'admin'),
  isSuperAdmin: vi.fn(async () => activeSession?.user?.email === process.env.SUPER_ADMIN_EMAIL),
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(),
    },
  },
}));

vi.mock('@/libs/reviewSummary', () => ({
  attachRestaurantRatings: vi.fn(async (items) => items),
}));

const uniqueEmail = (label: string) =>
  `e2e-category-cleanup-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSuperAdminSession = (email: string) => {
  process.env.SUPER_ADMIN_EMAIL = email;
  activeSession = { user: { email, role: 'admin' } };
};

const jsonRequest = (method: string, body: Record<string, unknown>) =>
  new Request('http://localhost/api/categories', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('E2E: admin category menu cleanup', () => {
  let superAdmin: any;
  let restaurantOwner: any;
  let restaurant: any;
  let categoryId: string;
  let menuItemId: string;
  const previousSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await User.deleteMany({ email: /e2e-category-cleanup-/i });
    await Restaurant.deleteMany({ name: /e2e-category-cleanup-/i });
    await Category.deleteMany({ name: /e2e-category-cleanup-/i });
    await MenuItem.deleteMany({ name: /e2e-category-cleanup-/i });
    vi.mocked(cloudinary.uploader.destroy).mockClear();

    superAdmin = await User.create({
      name: 'Category Cleanup Super Admin',
      email: uniqueEmail('super-admin'),
      password: 'hashed',
      provider: 'credentials',
      role: 'admin',
    });

    restaurantOwner = await User.create({
      name: 'Category Cleanup Owner',
      email: uniqueEmail('owner'),
      password: 'hashed',
      provider: 'credentials',
      role: 'admin',
    });

    restaurant = await Restaurant.create({
      ownerId: restaurantOwner._id,
      name: `e2e-category-cleanup-restaurant-${Date.now()}`,
      street: 'Cleanup Street 1',
      city: 'Sarajevo',
      postalCode: '71000',
      country: 'BA',
      latitude: 43.8563,
      longitude: 18.4131,
      contact: '+38761123456',
      email: uniqueEmail('restaurant'),
      description: 'Restaurant used for category cleanup e2e coverage.',
      tax: 10,
      courierFee: 5,
      images: ['https://res.cloudinary.com/demo/image/upload/restaurants/category-cleanup.jpg'],
    });
    await User.findByIdAndUpdate(restaurantOwner._id, { restaurantId: restaurant._id });
  });

  afterAll(async () => {
    activeSession = null;
    if (previousSuperAdminEmail === undefined) {
      delete process.env.SUPER_ADMIN_EMAIL;
    } else {
      process.env.SUPER_ADMIN_EMAIL = previousSuperAdminEmail;
    }
    await User.deleteMany({ email: /e2e-category-cleanup-/i });
    await Restaurant.deleteMany({ name: /e2e-category-cleanup-/i });
    await Category.deleteMany({ name: /e2e-category-cleanup-/i });
    await MenuItem.deleteMany({ name: /e2e-category-cleanup-/i });
    await mongoose.disconnect();
  });

  it('removes menu items from the category and public restaurant menu after category deletion', async () => {
    setSuperAdminSession(superAdmin.email);

    const { POST: CreateCategory, DELETE: DeleteCategory } =
      await import('@/app/api/categories/route');
    const createCategoryResponse = await CreateCategory(
      jsonRequest('POST', { name: `e2e-category-cleanup-category-${Date.now()}` })
    );
    const createdCategory = await createCategoryResponse.json();

    expect(createCategoryResponse.status).toBe(200);
    categoryId = createdCategory._id.toString();

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: restaurantOwner._id,
      name: `e2e-category-cleanup-menu-${Date.now()}`,
      description: 'Menu item that should disappear after category deletion.',
      image: 'https://res.cloudinary.com/demo/image/upload/v123/menu-items/category-cleanup.jpg',
      category: categoryId,
      priceType: 'single',
      priceSmall: 12,
      priceMedium: null,
      priceLarge: null,
    });
    menuItemId = menuItem._id.toString();

    const { GET: GetRestaurantMenu } = await import('@/app/api/restaurants/[id]/menu/route');
    const beforeDeleteResponse = await GetRestaurantMenu(
      new Request(
        `http://localhost/api/restaurants/${restaurant._id.toString()}/menu?q=e2e-category-cleanup&categories=${encodeURIComponent(
          createdCategory.name
        )}`
      ) as any,
      { params: Promise.resolve({ id: restaurant._id.toString() }) }
    );
    const beforeDeleteBody = await beforeDeleteResponse.json();

    expect(beforeDeleteResponse.status).toBe(200);
    expect(beforeDeleteBody.total).toBe(1);
    expect(beforeDeleteBody.items[0]._id.toString()).toBe(menuItemId);

    const deleteCategoryResponse = await DeleteCategory(jsonRequest('DELETE', { _id: categoryId }));
    const deletedCategory = await deleteCategoryResponse.json();

    expect(deleteCategoryResponse.status).toBe(200);
    expect(deletedCategory._id.toString()).toBe(categoryId);
    expect(await MenuItem.findById(menuItemId)).toBeNull();
    expect(await Category.findById(categoryId)).toBeNull();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('menu-items/category-cleanup');

    const afterDeleteResponse = await GetRestaurantMenu(
      new Request(
        `http://localhost/api/restaurants/${restaurant._id.toString()}/menu?q=e2e-category-cleanup&categories=${encodeURIComponent(
          createdCategory.name
        )}`
      ) as any,
      { params: Promise.resolve({ id: restaurant._id.toString() }) }
    );
    const afterDeleteBody = await afterDeleteResponse.json();

    expect(afterDeleteResponse.status).toBe(200);
    expect(afterDeleteBody.total).toBe(0);
    expect(afterDeleteBody.items).toEqual([]);
  });
});
