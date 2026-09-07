import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { notifyWaitingUsersIfRestaurantAcceptingOrders } from '@/libs/restaurantAvailabilityRequests';

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: vi.fn((value: string) => value !== 'bad-id'),
      },
    },
  },
  Types: {
    ObjectId: {
      isValid: vi.fn((value: string) => value !== 'bad-id'),
    },
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('@/libs/restaurantAvailabilityRequests', () => ({
  notifyWaitingUsersIfRestaurantAcceptingOrders: vi.fn(),
}));

const loadRoute = async () => import('@/app/api/restaurants/[id]/ordering-status/route');

const workingHours = [
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

const mockRestaurant = (restaurant: Record<string, unknown> | null) => {
  const lean = vi.fn().mockResolvedValue(restaurant);
  const select = vi.fn().mockReturnValue({ lean });
  vi.mocked(Restaurant.findById).mockReturnValue({ select } as never);
};

describe('/api/restaurants/[id]/ordering-status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Order.countDocuments).mockResolvedValue(0 as never);
  });

  it('returns a compact accepting status for a restaurant', async () => {
    mockRestaurant({
      _id: 'restaurant-1',
      name: 'Pizza Hub',
      workingHours,
      blockedDates: [],
      activeOrderLimit: 10,
      isPaused: false,
    });

    const { GET } = await loadRoute();
    const res = await GET({} as never, { params: Promise.resolve({ id: 'restaurant-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        restaurantId: 'restaurant-1',
        restaurantName: 'Pizza Hub',
        isAcceptingOrders: true,
        isBusy: false,
      })
    );
  });

  it('marks a restaurant as unavailable when active kitchen orders reach capacity', async () => {
    mockRestaurant({
      _id: 'restaurant-1',
      name: 'Pizza Hub',
      workingHours,
      blockedDates: [],
      activeOrderLimit: 2,
      isPaused: false,
    });
    vi.mocked(Order.countDocuments).mockResolvedValueOnce(2 as never);

    const { GET } = await loadRoute();
    const res = await GET({} as never, { params: Promise.resolve({ id: 'restaurant-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAcceptingOrders).toBe(false);
    expect(body.isBusy).toBe(true);
    expect(body.reason).toContain('very busy');
    expect(notifyWaitingUsersIfRestaurantAcceptingOrders).toHaveBeenCalledWith({
      restaurantId: 'restaurant-1',
      restaurantName: 'Pizza Hub',
      isAcceptingOrders: false,
    });
  });
});
