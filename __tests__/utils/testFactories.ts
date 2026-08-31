import { faker } from '@faker-js/faker';

export const seedTestFaker = (seed = 2026) => faker.seed(seed);

export const createTestUser = (overrides: Record<string, unknown> = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  phone: '+38761123456',
  role: 'user',
  ...overrides,
});

export const createTestRestaurant = (overrides: Record<string, unknown> = {}) => ({
  _id: faker.database.mongodbObjectId(),
  name: `${faker.company.name()} Restaurant`,
  city: 'Sarajevo',
  country: 'Bosnia & Herzegovina',
  minimumOrderAmount: 10,
  courierFee: 5,
  tax: 17,
  ...overrides,
});

export const createTestOrder = (overrides: Record<string, unknown> = {}) => ({
  _id: faker.database.mongodbObjectId(),
  email: faker.internet.email().toLowerCase(),
  phone: '+38761123456',
  orderStatus: 'placed',
  orderPaid: false,
  paid: false,
  total: 15,
  deliveryFee: 5,
  createdAt: faker.date.recent(),
  ...overrides,
});
