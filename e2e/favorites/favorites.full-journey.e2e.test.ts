import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { User } from '@/models/user';
import { Restaurant } from '@/models/restaurant';
import mongoose from 'mongoose';

// Use test DB when running e2e
if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS || 'mongodb://localhost:27017/food-ordering-app-tests-e2e';
}

describe('E2E: Favorites full journey', () => {
  let customerId: mongoose.Types.ObjectId;
  let intruderId: mongoose.Types.ObjectId;
  let ownerId: mongoose.Types.ObjectId;
  let restaurantId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  afterAll(async () => {
    if (customerId) await User.deleteOne({ _id: customerId });
    if (intruderId) await User.deleteOne({ _id: intruderId });
    if (ownerId) await User.deleteOne({ _id: ownerId });
    if (restaurantId) await Restaurant.deleteOne({ _id: restaurantId });
    await mongoose.connection.close();
  });

  it('customer can add/remove favorites and other users cannot affect each other', async () => {
    // create users
    const customer = await User.create({
      name: 'Fav Customer',
      email: `e2e-fav-customer-${Date.now()}@example.com`,
      password: 'hashed-placeholder',
      role: 'user',
      provider: 'credentials',
    });
    customerId = customer._id;

    const intruder = await User.create({
      name: 'Fav Intruder',
      email: `e2e-fav-intruder-${Date.now()}@example.com`,
      password: 'hashed-placeholder',
      role: 'user',
      provider: 'credentials',
    });
    intruderId = intruder._id;

    const owner = await User.create({
      name: 'Rest Owner',
      email: `e2e-fav-owner-${Date.now()}@example.com`,
      password: 'hashed-placeholder',
      role: 'admin',
      provider: 'credentials',
    });
    ownerId = owner._id;

    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: 'E2E Favorite Restaurant',
      street: '1 Test St',
      city: 'Test',
      postalCode: '00000',
      country: 'Testland',
      latitude: 0,
      longitude: 0,
      contact: '+100',
      email: 'rest@example.com',
      description: 'Test restaurant for favorites e2e',
      tax: 10,
      courierFee: 5,
    });
    restaurantId = restaurant._id;

    // import handlers and mock sessions dynamically
    vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
    const auth = await import('next-auth/next');
    const favModule = await import('@/app/api/favorites/restaurants/route');
    const { POST, GET } = favModule as typeof import('@/app/api/favorites/restaurants/route');

    // Mock getServerSession to represent `customer` when adding
    (auth.getServerSession as unknown as vi.Mock).mockResolvedValueOnce({
      user: { email: customer.email },
    } as any);

    // Add favorite as customer
    const addResp = await POST(
      new Request('http://localhost/api/favorites/restaurants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurantId.toString() }),
      })
    );
    expect(addResp.status).toBe(200);
    const addBody = await addResp.json();
    expect(addBody.success).toBe(true);
    expect(addBody.isFavorite).toBe(true);

    // As intruder, add same restaurant to their favorites
    (auth.getServerSession as unknown as vi.Mock).mockResolvedValueOnce({
      user: { email: intruder.email },
    } as any);
    const intruderResp = await POST(
      new Request('http://localhost/api/favorites/restaurants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurantId.toString() }),
      })
    );
    expect(intruderResp.status).toBe(200);
    const intruderBody = await intruderResp.json();
    expect(intruderBody.success).toBe(true);
    expect(intruderBody.isFavorite).toBe(true);

    // Customer toggles again to remove
    (auth.getServerSession as unknown as vi.Mock).mockResolvedValueOnce({
      user: { email: customer.email },
    } as any);
    const removeResp = await POST(
      new Request('http://localhost/api/favorites/restaurants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurantId.toString() }),
      })
    );
    expect(removeResp.status).toBe(200);
    const removeBody = await removeResp.json();
    expect(removeBody.success).toBe(true);
    expect(removeBody.isFavorite).toBe(false);

    // Verify DB state: customer has removed, intruder still has it
    const refreshedCustomer = await User.findById(customerId).lean();
    const refreshedIntruder = await User.findById(intruderId).lean();

    const custFavs = Array.isArray(refreshedCustomer?.favoriteRestaurants)
      ? refreshedCustomer?.favoriteRestaurants.map(String)
      : [];
    const intrFavs = Array.isArray(refreshedIntruder?.favoriteRestaurants)
      ? refreshedIntruder?.favoriteRestaurants.map(String)
      : [];

    expect(custFavs.includes(restaurantId.toString())).toBe(false);
    expect(intrFavs.includes(restaurantId.toString())).toBe(true);

    // Finally, verify GET returns intruder's favorite when logged as intruder
    (auth.getServerSession as unknown as vi.Mock).mockResolvedValueOnce({
      user: { email: intruder.email },
    } as any);
    const getResp = await GET();
    expect(getResp.status).toBe(200);
    const getBody = await getResp.json();
    expect(Array.isArray(getBody.restaurants)).toBe(true);
    expect(getBody.restaurants.some((r: any) => String(r._id) === restaurantId.toString())).toBe(
      true
    );
  });
});
