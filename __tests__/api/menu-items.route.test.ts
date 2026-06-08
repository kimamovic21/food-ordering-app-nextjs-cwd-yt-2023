import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { User } from '@/models/user';
import { MenuItem } from '@/models/menuItem';
import { Category } from '@/models/category';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: class {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
        toString() {
          return this.value;
        }
        static isValid() {
          return true;
        }
      },
    },
  },
  Types: {
    ObjectId: class {
      value: string;
      constructor(value: string) {
        this.value = value;
      }
      toString() {
        return this.value;
      }
      static isValid() {
        return true;
      }
    },
  },
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/category', () => ({
  Category: {
    find: vi.fn(),
  },
}));

vi.mock('@/libs/reviewSummary', () => ({
  attachRestaurantRatings: vi.fn(async (items) => items),
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(),
    },
  },
}));

const loadMenuItemsRoute = async () => import('@/app/api/menu-items/route');

const currentAdmin = {
  _id: { toString: () => 'admin-1' },
  restaurantId: { toString: () => 'restaurant-1' },
};

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/menu-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/menu-items route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAdmin).mockResolvedValue(true as never);
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValue(currentAdmin as never);
  });

  it('requires an admin session to create menu items', async () => {
    vi.mocked(isAdmin).mockResolvedValueOnce(false as never);

    const { POST } = await loadMenuItemsRoute();
    const res = await POST(createRequest({}));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(MenuItem.create).not.toHaveBeenCalled();
  });

  it('rejects create when required prices for priceType are missing', async () => {
    const { POST } = await loadMenuItemsRoute();
    const res = await POST(
      createRequest({
        name: 'Family Pizza',
        description: 'Pizza with three price levels',
        image: 'https://example.com/pizza.jpg',
        category: 'category-1',
        priceType: 'triple',
        priceSmall: '8',
        priceMedium: '12',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Please provide 3 prices' });
    expect(MenuItem.create).not.toHaveBeenCalled();
  });

  it('creates menu items under the current admin restaurant', async () => {
    vi.mocked(MenuItem.create).mockResolvedValueOnce({
      _id: 'menu-1',
      name: 'Soup',
      restaurantId: currentAdmin.restaurantId,
    } as never);

    const { POST } = await loadMenuItemsRoute();
    const res = await POST(
      createRequest({
        name: 'Soup',
        description: 'Warm soup',
        image: 'https://example.com/soup.jpg',
        category: 'category-1',
        priceType: 'single',
        priceSmall: '5.50',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body._id).toBe('menu-1');
    expect(MenuItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: currentAdmin._id,
        restaurantId: currentAdmin.restaurantId,
        priceType: 'single',
        priceSmall: 5.5,
        priceMedium: null,
        priceLarge: null,
      })
    );
  });

  it('blocks updates to menu items owned by another admin', async () => {
    vi.mocked(MenuItem.findById).mockResolvedValueOnce({
      _id: 'menu-2',
      adminId: { toString: () => 'other-admin' },
    } as never);

    const { PUT } = await loadMenuItemsRoute();
    const res = await PUT(
      new Request('http://localhost/api/menu-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: 'menu-2',
          name: 'Updated',
          priceType: 'single',
          priceSmall: '8',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'You are not authorized to edit this menu item' });
    expect(MenuItem.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('builds an advanced search aggregation for query/category/price filters', async () => {
    vi.mocked(Category.find).mockResolvedValueOnce([
      { _id: 'category-1', name: 'Pizza Specials' },
    ] as never);
    vi.mocked(MenuItem.aggregate).mockResolvedValueOnce([
      {
        items: [{ _id: 'menu-1', name: 'Margherita' }],
        totalCount: [{ count: 1 }],
      },
    ] as never);

    const { GET } = await loadMenuItemsRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/menu-items?q=pizza.categories&categories=Pizza%20Specials&minPrice=5&maxPrice=20&sort=price_asc&page=2&limit=4'
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      items: [{ _id: 'menu-1', name: 'Margherita' }],
      total: 1,
      page: 2,
      pageSize: 4,
    });
    expect(MenuItem.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ $match: expect.any(Object) }),
        expect.objectContaining({ $sort: { effectivePrice: 1, createdAt: -1 } }),
      ])
    );
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });
});
