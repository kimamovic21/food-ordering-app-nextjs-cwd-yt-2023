import { describe, expect, it } from 'vitest';
import {
  createTestOrder,
  createTestRestaurant,
  createTestUser,
  seedTestFaker,
} from './testFactories';

describe('test factories', () => {
  it('creates deterministic fake test records when seeded', () => {
    seedTestFaker(123);
    const user = createTestUser();
    const restaurant = createTestRestaurant();
    const order = createTestOrder({ userId: user._id, restaurantId: restaurant._id });

    expect(user.email).toContain('@');
    expect(user.phone).toBe('+38761123456');
    expect(restaurant.minimumOrderAmount).toBe(10);
    expect(order).toEqual(
      expect.objectContaining({
        userId: user._id,
        restaurantId: restaurant._id,
        deliveryFee: 5,
      })
    );
  });
});
