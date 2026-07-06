import mongoose from 'mongoose';
import { MenuItem } from '@/models/menuItem';

vi.mock('mongoose', () => {
  class ObjectIdMock {
    value: string;

    constructor(value: string) {
      this.value = value;
    }

    toString() {
      return this.value;
    }

    static isValid(value: unknown) {
      return typeof value === 'string' && value.length > 0 && !value.startsWith('bad-');
    }
  }

  return {
    default: {
      connect: vi.fn(),
      Types: {
        ObjectId: ObjectIdMock,
      },
    },
  };
});

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
  },
}));

const mockMenuItems = (items: any[]) => {
  vi.mocked(MenuItem.find).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(items),
    }),
  } as never);
};

const createRequest = (cartItems: unknown[]) =>
  new Request('http://localhost/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartItems }),
  });

const loadRoute = async () => (await import('@/app/api/cart/validate/route')).POST;

describe('POST /api/cart/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns current menu data and detects stale cart prices', async () => {
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        image: 'https://example.com/pizza.png',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: true,
        priceType: 'triple',
        priceSmall: 8,
        priceMedium: 11,
        priceLarge: 14.5,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'large',
          quantity: 2,
          restaurantId: 'restaurant-1',
          price: 1,
        },
      ])
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(body.canCheckout).toBe(true);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        status: 'valid',
        name: 'Pizza',
        size: 'large',
        price: 14.5,
        priceChanged: true,
        previousPrice: 1,
      })
    );
  });

  it('blocks checkout when the menu item is unavailable', async () => {
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: false,
        priceType: 'triple',
        priceSmall: 8,
        priceMedium: 11,
        priceLarge: 14.5,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'large',
          quantity: 1,
          restaurantId: 'restaurant-1',
          price: 14.5,
        },
      ])
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        status: 'unavailable',
        isAvailable: false,
      })
    );
  });

  it('blocks checkout when the requested size no longer exists', async () => {
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: true,
        priceType: 'single',
        priceSmall: 8,
        priceMedium: null,
        priceLarge: null,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'large',
          quantity: 1,
          restaurantId: 'restaurant-1',
          price: 14.5,
        },
      ])
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        status: 'invalid_size',
        message: 'Pizza is not available in that size anymore.',
      })
    );
  });

  it('marks deleted cart items as blocking', async () => {
    mockMenuItems([]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'large',
          quantity: 1,
          restaurantId: 'restaurant-1',
          price: 14.5,
        },
      ])
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        status: 'deleted',
      })
    );
  });
});
