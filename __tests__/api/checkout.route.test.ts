import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Coupon } from '@/models/coupon';
import { getCouponValidationError } from '@/libs/coupon';

const stripeCreateSession = vi.fn();

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: stripeCreateSession,
      },
    };
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('mongoose', () => ({
  ObjectIdMock: class {
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
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/models/coupon', () => ({
  Coupon: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/libs/loyaltyCalculator', () => ({
  calculateLoyaltyStatus: vi.fn(() => ({
    discountPercentage: 0,
    currentTier: null,
  })),
}));

vi.mock('@/libs/coupon', () => ({
  normalizeCouponCode: vi.fn((code: string) => code.trim().toUpperCase()),
  getCouponValidationError: vi.fn(() => null),
  calculateCouponDiscountAmount: vi.fn(() => 0),
}));

vi.mock('@/libs/notifications', () => ({
  notifyOrderPlaced: vi.fn(),
  notifyRestaurantAdminsAboutPaidOrder: vi.fn(),
}));

vi.mock('@/libs/auditLog', () => ({
  createAuditLog: vi.fn(),
}));

const openWorkingHours = [
  { day: 'monday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'tuesday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'wednesday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'thursday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'friday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'saturday', openTime: '00:00', closeTime: '23:59', isClosed: false },
  { day: 'sunday', openTime: '00:00', closeTime: '23:59', isClosed: false },
];

const openRestaurant = {
  _id: 'restaurant-1',
  tax: 10,
  courierFee: 5,
  latitude: 43.8563,
  longitude: 18.4131,
  workingHours: openWorkingHours,
  blockedDates: [],
  deliveryRadiusKm: 10,
  isPaused: false,
};

const loadCheckoutRoute = async () => {
  const mod = await import('@/app/api/checkout/route');
  return mod.POST;
};

const createCheckoutRequest = (overrides: Partial<Record<string, unknown>> = {}) => {
  const baseBody = {
    phone: '+1234567',
    streetAddress: 'Street 1',
    postalCode: '71000',
    city: 'Sarajevo',
    country: 'BiH',
    deliveryLatitude: 43.8563,
    deliveryLongitude: 18.4131,
    specialInstructions: 'No onions, please call when outside.',
    loyaltyDiscountPercentage: 0,
    cartItems: [
      {
        _id: 'menu-item-1',
        name: 'Pizza',
        size: 'Large',
        price: 14.5,
        quantity: 1,
        restaurantId: 'restaurant-1',
      },
    ],
  };

  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ ...baseBody, ...overrides }),
  });
};

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_checkout';

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'checkout-user@example.com' },
    } as never);

    vi.mocked(User.findOne).mockResolvedValue({
      _id: 'user-1',
      email: 'checkout-user@example.com',
      restaurantId: null,
    } as never);

    vi.mocked(Restaurant.findById).mockResolvedValue(openRestaurant as never);

    vi.mocked(MenuItem.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            restaurantId: { toString: () => 'restaurant-1' },
            adminId: { toString: () => 'someone-else' },
            isAvailable: true,
            priceType: 'triple',
            priceSmall: 8,
            priceMedium: 11,
            priceLarge: 14.5,
          },
        ]),
      }),
    } as never);

    vi.mocked(Order.countDocuments).mockResolvedValue(0 as never);
    vi.mocked(Order.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as never);

    vi.mocked(Order.create).mockResolvedValue({
      _id: { toString: () => 'order-1' },
      stripeSessionId: null,
      save: vi.fn().mockResolvedValue(undefined),
    } as never);

    vi.mocked(Coupon.findOne).mockResolvedValue(null as never);

    stripeCreateSession.mockResolvedValue({
      id: 'cs_test_checkout_1',
      url: 'https://checkout.stripe.com/session/test-1',
    });
  });

  it('returns 401 when no authenticated session is present', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('rejects checkout when cart contains multiple restaurants', async () => {
    const POST = await loadCheckoutRoute();

    const response = await POST(
      createCheckoutRequest({
        cartItems: [
          {
            _id: 'menu-item-1',
            name: 'Pizza',
            size: 'Large',
            price: 14.5,
            quantity: 1,
            restaurantId: 'restaurant-1',
          },
          {
            _id: 'menu-item-2',
            name: 'Pasta',
            size: 'Small',
            price: 10,
            quantity: 1,
            restaurantId: 'restaurant-2',
          },
        ],
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Cart must contain items from one restaurant only' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when user is ordering from own restaurant', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: 'user-1',
      email: 'checkout-user@example.com',
      restaurantId: { toString: () => 'restaurant-1' },
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'You cannot order from your own restaurant' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when restaurant paused new orders', async () => {
    vi.mocked(Restaurant.findById).mockResolvedValueOnce({
      ...openRestaurant,
      isPaused: true,
      pauseReason: 'Kitchen is catching up on current orders.',
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: 'Kitchen is catching up on current orders.' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when delivery location is outside restaurant radius', async () => {
    const POST = await loadCheckoutRoute();
    const response = await POST(
      createCheckoutRequest({
        deliveryLatitude: 44.8563,
        deliveryLongitude: 19.4131,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('This restaurant delivers within 10 km.');
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when restaurant active kitchen orders reached the limit', async () => {
    vi.mocked(Restaurant.findById).mockResolvedValueOnce({
      ...openRestaurant,
      activeOrderLimit: 10,
    } as never);
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(10 as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: 'This restaurant is very busy at the moment. Please wait a little bit and try again.',
    });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when subtotal is below restaurant minimum order amount', async () => {
    vi.mocked(Restaurant.findById).mockResolvedValueOnce({
      ...openRestaurant,
      minimumOrderAmount: 20,
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Minimum order amount for this restaurant is $20.00.',
    });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when coupon validation fails', async () => {
    vi.mocked(Coupon.findOne).mockResolvedValueOnce({
      _id: 'coupon-1',
      code: 'SAVE10',
      title: 'Save 10',
      discountValue: 10,
      minimumOrderAmount: 100,
    } as never);

    vi.mocked(getCouponValidationError).mockReturnValueOnce('Minimum order amount is not met');

    const POST = await loadCheckoutRoute();

    const response = await POST(
      createCheckoutRequest({
        couponCode: 'save10',
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Minimum order amount is not met' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('rejects checkout when a cart item is unavailable', async () => {
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            restaurantId: { toString: () => 'restaurant-1' },
            adminId: { toString: () => 'someone-else' },
            isAvailable: false,
            priceType: 'triple',
            priceSmall: 8,
            priceMedium: 11,
            priceLarge: 14.5,
          },
        ]),
      }),
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Pizza is currently unavailable' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('uses current menu item prices from the database instead of stale cart prices', async () => {
    const POST = await loadCheckoutRoute();
    const response = await POST(
      createCheckoutRequest({
        cartItems: [
          {
            _id: 'menu-item-1',
            name: 'Old pizza name',
            size: 'Large',
            price: 1,
            quantity: 2,
            restaurantId: 'restaurant-1',
          },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.com/session/test-1' });
    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cartProducts: [
          expect.objectContaining({
            name: 'Pizza',
            size: 'large',
            price: 14.5,
            quantity: 2,
          }),
        ],
        total: 34,
      })
    );
    expect(stripeCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({
              unit_amount: 1450,
              product_data: { name: 'Pizza (large)' },
            }),
          }),
        ]),
      })
    );
  });

  it('rejects checkout when cart asks for a size that the menu item no longer sells', async () => {
    vi.mocked(MenuItem.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: { toString: () => 'menu-item-1' },
            name: 'Pizza',
            restaurantId: { toString: () => 'restaurant-1' },
            adminId: { toString: () => 'someone-else' },
            isAvailable: true,
            priceType: 'single',
            priceSmall: 8,
            priceMedium: null,
            priceLarge: null,
          },
        ]),
      }),
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Pizza is not available in that size' });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('allows the same menu item to be ordered in multiple valid sizes', async () => {
    const POST = await loadCheckoutRoute();
    const response = await POST(
      createCheckoutRequest({
        cartItems: [
          {
            _id: 'menu-item-1',
            name: 'Pizza',
            size: 'Small',
            price: 8,
            quantity: 1,
            restaurantId: 'restaurant-1',
          },
          {
            _id: 'menu-item-1',
            name: 'Pizza',
            size: 'Large',
            price: 14.5,
            quantity: 1,
            restaurantId: 'restaurant-1',
          },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.com/session/test-1' });
    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cartProducts: [
          expect.objectContaining({ size: 'small', price: 8 }),
          expect.objectContaining({ size: 'large', price: 14.5 }),
        ],
        total: 27.5,
      })
    );
  });

  it('rejects checkout when previous delivered order still needs confirmation', async () => {
    vi.mocked(Order.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'previous-order' }),
      }),
    } as never);

    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'Please confirm your previous delivered order before starting a new checkout.',
    });
    expect(stripeCreateSession).not.toHaveBeenCalled();
  });

  it('persists optional special instructions on created orders', async () => {
    const POST = await loadCheckoutRoute();
    const response = await POST(createCheckoutRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.com/session/test-1' });
    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        specialInstructions: 'No onions, please call when outside.',
      })
    );
  });

  it('returns 500 when stripe session creation fails', async () => {
    stripeCreateSession.mockRejectedValueOnce(new Error('Stripe checkout is down'));

    const POST = await loadCheckoutRoute();

    await expect(POST(createCheckoutRequest())).rejects.toThrow('Stripe checkout is down');
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
  });
});
