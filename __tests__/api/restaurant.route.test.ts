import { getServerSession } from 'next-auth/next';
import { mongoConnect } from '@/libs/mongoConnect';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import cloudinary from '@/libs/cloudinary';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
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

const loadRestaurantRoute = async () => import('@/app/api/restaurant/route');

const adminUser = {
  _id: { toString: () => 'admin-1' },
  email: 'admin@example.com',
  role: 'admin',
};

const validRestaurantBody = {
  name: 'Priority Test Restaurant',
  street: 'Main Street 1',
  city: 'Sarajevo',
  postalCode: '71000',
  country: 'BA',
  latitude: 43.8563,
  longitude: 18.4131,
  contact: '+38761111222',
  email: 'restaurant@example.com',
  description: 'A restaurant description long enough for validation.',
  tax: 12,
  courierFee: 4,
  totalEmployees: 3,
  images: ['https://res.cloudinary.com/demo/image/upload/restaurants/priority.jpg'],
};

const jsonRequest = (
  method: string,
  body: Record<string, unknown>,
  url = 'http://localhost/api/restaurant'
) =>
  new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/restaurant route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: adminUser.email },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue(adminUser as never);
  });

  it('blocks restaurant creation for unauthenticated users', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { POST } = await loadRestaurantRoute();
    const res = await POST(jsonRequest('POST', validRestaurantBody) as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(Restaurant.create).not.toHaveBeenCalled();
  });

  it('creates a restaurant for an admin and assigns it to the user', async () => {
    vi.mocked(Restaurant.findOne).mockResolvedValueOnce(null as never);
    vi.mocked(Restaurant.create).mockResolvedValueOnce({
      _id: 'restaurant-1',
      ...validRestaurantBody,
    } as never);

    const { POST } = await loadRestaurantRoute();
    const res = await POST(jsonRequest('POST', validRestaurantBody) as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.restaurant._id).toBe('restaurant-1');
    expect(Restaurant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: adminUser._id,
        name: validRestaurantBody.name,
        images: validRestaurantBody.images,
      })
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(adminUser._id, {
      restaurantId: 'restaurant-1',
    });
  });

  it('rejects invalid blocked dates before creating a restaurant', async () => {
    vi.mocked(Restaurant.findOne).mockResolvedValueOnce(null as never);

    const { POST } = await loadRestaurantRoute();
    const res = await POST(
      jsonRequest('POST', {
        ...validRestaurantBody,
        blockedDates: [{ date: 'not-a-date', reason: 'Kitchen maintenance' }],
      }) as any
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid blocked date entry' });
    expect(Restaurant.create).not.toHaveBeenCalled();
  });

  it('deletes only an owned restaurant and cascades menu item/image cleanup', async () => {
    const restaurant = {
      _id: 'restaurant-1',
      ownerId: adminUser._id,
      images: ['https://res.cloudinary.com/demo/image/upload/restaurants/old-rest.jpg'],
    };
    const menuItems = [
      { image: 'https://res.cloudinary.com/demo/image/upload/menu-items/old-menu.jpg' },
      { image: '' },
    ];

    vi.mocked(Restaurant.findOne).mockResolvedValueOnce(restaurant as never);
    vi.mocked(MenuItem.find).mockResolvedValueOnce(menuItems as never);

    const { DELETE } = await loadRestaurantRoute();
    const res = await DELETE(
      new Request('http://localhost/api/restaurant?id=restaurant-1', { method: 'DELETE' }) as any
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      message: 'Restaurant deleted successfully',
      deletedMenuItemsCount: 2,
    });
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('restaurants/old-rest');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('menu-items/old-menu');
    expect(MenuItem.deleteMany).toHaveBeenCalledWith({ restaurantId: 'restaurant-1' });
    expect(Restaurant.findByIdAndDelete).toHaveBeenCalledWith('restaurant-1');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(adminUser._id, { restaurantId: null });
    expect(mongoConnect).toHaveBeenCalled();
  });
});
