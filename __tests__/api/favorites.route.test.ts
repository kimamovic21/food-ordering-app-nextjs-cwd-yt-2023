import { getServerSession } from 'next-auth/next';

vi.mock('mongoose', () => ({
  Schema: class SchemaMock {},
  model: vi.fn(),
  models: {},
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
    updateOne: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('@/libs/reviewSummary', () => ({
  getRestaurantRatingSummaries: vi.fn(async () => new Map()),
}));

const loadFavoriteRestaurants = async () => await import('@/app/api/favorites/restaurants/route');
const loadFavoriteMenuItems = async () => await import('@/app/api/favorites/menu-items/route');
const loadFavoritesIndex = async () => await import('@/app/api/favorites/route');

describe('/api/favorites routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 when favorites index is accessed without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadFavoritesIndex();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('adds and removes favorite restaurant for current user', async () => {
    const userModel = await import('@/models/user');
    const restaurantModel = await import('@/models/restaurant');

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'user@example.com' } } as never);
    vi.mocked(userModel.User.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1', restaurantId: null, favoriteRestaurants: [] }),
      }),
    } as never);
    vi.mocked(restaurantModel.Restaurant.findById).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ _id: 'rest-1', ownerId: 'owner-2' }),
    } as never);

    const { POST } = await loadFavoriteRestaurants();
    let res = await POST(new Request('http://localhost/api/favorites/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: '507f1f77bcf86cd799439011' }),
    }));
    let body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('added');

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'user@example.com' } } as never);
    vi.mocked(userModel.User.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1', restaurantId: null, favoriteRestaurants: ['507f1f77bcf86cd799439011'] }),
      }),
    } as never);
    vi.mocked(restaurantModel.Restaurant.findById).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ _id: 'rest-1', ownerId: 'owner-2' }),
    } as never);

    res = await POST(new Request('http://localhost/api/favorites/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: '507f1f77bcf86cd799439011' }),
    }));
    body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('added');
  });

  it('adds and removes favorite menu item for current user', async () => {
    const userModel = await import('@/models/user');
    const menuItemModel = await import('@/models/menuItem');

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'user@example.com' } } as never);
    vi.mocked(userModel.User.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1', restaurantId: null, favoriteMenuItems: [] }),
      }),
    } as never);
    vi.mocked(menuItemModel.MenuItem.findById).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ _id: 'item-1', adminId: 'owner-2', restaurantId: 'rest-2' }),
    } as never);

    const { POST } = await loadFavoriteMenuItems();
    let res = await POST(new Request('http://localhost/api/favorites/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemId: '507f1f77bcf86cd799439012' }),
    }));
    let body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('added');

    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'user@example.com' } } as never);
    vi.mocked(userModel.User.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'user-1', restaurantId: null, favoriteMenuItems: ['507f1f77bcf86cd799439012'] }),
      }),
    } as never);
    vi.mocked(menuItemModel.MenuItem.findById).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ _id: 'item-1', adminId: 'owner-2', restaurantId: 'rest-2' }),
    } as never);

    res = await POST(new Request('http://localhost/api/favorites/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemId: '507f1f77bcf86cd799439012' }),
    }));
    body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('added');
  });
});
