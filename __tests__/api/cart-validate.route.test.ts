import mongoose from 'mongoose';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';

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

vi.mock('@/models/order', () => ({
  Order: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
  },
}));

const openWorkingHours = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
].map((day) => ({
  day,
  openTime: '00:00',
  closeTime: '23:59',
  isClosed: false,
}));

const createRestaurant = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'restaurant-1' },
  name: 'Pizza Hub',
  workingHours: openWorkingHours,
  blockedDates: [],
  deliveryRadiusKm: 10,
  isPaused: false,
  pauseReason: '',
  activeOrderLimit: 10,
  minimumOrderAmount: 10,
  latitude: 43,
  longitude: 18,
  ...overrides,
});

const mockMenuItems = (items: any[]) => {
  vi.mocked(MenuItem.find).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(items),
    }),
  } as never);
};

const mockRestaurant = (restaurant: Record<string, unknown> | null = createRestaurant()) => {
  vi.mocked(Restaurant.findById).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(restaurant),
    }),
  } as never);
};

const createRequest = (
  cartItems: unknown[],
  extraBody: Record<string, unknown> = { deliveryLatitude: 43.01, deliveryLongitude: 18.01 }
) =>
  new Request('http://localhost/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartItems, ...extraBody }),
  });

const loadRoute = async () => (await import('@/app/api/cart/validate/route')).POST;

describe('POST /api/cart/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Order.countDocuments).mockResolvedValue(0);
  });

  it('returns current menu data and detects stale cart prices', async () => {
    mockRestaurant();
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
    expect(body.restaurant).toEqual(
      expect.objectContaining({
        status: 'valid',
        canCheckout: true,
        restaurantName: 'Pizza Hub',
      })
    );
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

  it('blocks checkout when the restaurant is busy', async () => {
    mockRestaurant(createRestaurant({ activeOrderLimit: 1 }));
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(1);
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: true,
        priceType: 'single',
        priceSmall: 12,
        priceMedium: null,
        priceLarge: null,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'single',
          quantity: 1,
          restaurantId: 'restaurant-1',
          price: 12,
        },
      ])
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.restaurant).toEqual(
      expect.objectContaining({
        status: 'busy',
        canCheckout: false,
      })
    );
    expect(body.message).toBe(
      'This restaurant is very busy at the moment. Please wait a little bit and try again.'
    );
  });

  it('blocks checkout when the subtotal is below the restaurant minimum', async () => {
    mockRestaurant(createRestaurant({ minimumOrderAmount: 20 }));
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: true,
        priceType: 'single',
        priceSmall: 12,
        priceMedium: null,
        priceLarge: null,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest([
        {
          _id: 'menu-item-1',
          size: 'single',
          quantity: 1,
          restaurantId: 'restaurant-1',
          price: 12,
        },
      ])
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.restaurant).toEqual(
      expect.objectContaining({
        status: 'below_minimum',
        canCheckout: false,
        subtotal: 12,
        minimumOrderAmount: 20,
      })
    );
    expect(body.message).toBe('Minimum order amount for this restaurant is $20.00.');
  });

  it('blocks checkout when the delivery location is outside the restaurant radius', async () => {
    mockRestaurant(createRestaurant({ deliveryRadiusKm: 2 }));
    mockMenuItems([
      {
        _id: { toString: () => 'menu-item-1' },
        name: 'Pizza',
        restaurantId: { toString: () => 'restaurant-1' },
        isAvailable: true,
        priceType: 'single',
        priceSmall: 12,
        priceMedium: null,
        priceLarge: null,
      },
    ]);

    const POST = await loadRoute();
    const response = await POST(
      createRequest(
        [
          {
            _id: 'menu-item-1',
            size: 'single',
            quantity: 1,
            restaurantId: 'restaurant-1',
            price: 12,
          },
        ],
        { deliveryLatitude: 43.1, deliveryLongitude: 18.1 }
      )
    );
    const body = await response.json();

    expect(body.canCheckout).toBe(false);
    expect(body.restaurant).toEqual(
      expect.objectContaining({
        status: 'outside_delivery_radius',
        canCheckout: false,
        deliveryRadiusKm: 2,
      })
    );
    expect(body.message).toContain('This restaurant delivers within 2 km');
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
