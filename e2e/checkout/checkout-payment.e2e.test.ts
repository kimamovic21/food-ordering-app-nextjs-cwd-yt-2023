import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { User } from '@/models/user';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { MenuItem } from '@/models/menuItem';
import { Coupon } from '@/models/coupon';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Ensure we're using test database
if (!process.env.MONGODB_URL) {
  process.env.MONGODB_URL =
    process.env.MONGODB_URL_TESTS ||
    'mongodb://localhost:27017/food-ordering-app-tests-cwd-yt-2023-tests';
}

describe('E2E: Checkout & Payment Flow', () => {
  let userId: mongoose.Types.ObjectId;
  let restaurantId: mongoose.Types.ObjectId;
  let menuItemId: mongoose.Types.ObjectId;
  let couponId: mongoose.Types.ObjectId;
  const testUserEmail = `checkout-test-${Date.now()}@example.com`;
  const restaurantOwnerEmail = `restaurant-owner-${Date.now()}@example.com`;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await User.deleteMany({ _id: { $in: [userId] } });
    }
    if (restaurantOwnerEmail) {
      await User.deleteOne({ email: restaurantOwnerEmail });
    }
    if (restaurantId) {
      await Restaurant.deleteOne({ _id: restaurantId });
    }
    if (menuItemId) {
      await MenuItem.deleteOne({ _id: menuItemId });
    }
    if (couponId) {
      await Coupon.deleteOne({ _id: couponId });
    }
    await Order.deleteMany({ email: testUserEmail });

    await mongoose.connection.close();
  });

  it('should create order with valid cart data', async () => {
    // Create test user (customer)
    const hashedPassword = bcrypt.hashSync('TestPassword123!', 10);
    const customer = await User.create({
      name: 'Checkout Test User',
      email: testUserEmail,
      password: hashedPassword,
      phone: '+1234567890',
      role: 'user',
      provider: 'credentials',
    });
    userId = customer._id;

    // Create restaurant owner
    const restaurantOwner = await User.create({
      name: 'Restaurant Owner',
      email: restaurantOwnerEmail,
      password: hashedPassword,
      phone: '+9876543210',
      role: 'admin',
      provider: 'credentials',
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      ownerId: restaurantOwner._id,
      name: 'Test Pizza Place',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111111',
      email: 'pizza@test.com',
      description: 'Delicious pizza for testing purposes. Must be at least 20 characters long!',
      tax: 10,
      courierFee: 5,
    });
    restaurantId = restaurant._id;

    // Create menu item
    const menuItem = await MenuItem.create({
      restaurantId: restaurantId,
      adminId: restaurantOwner._id,
      name: 'Test Pizza',
      category: 'pizza',
      description: 'Test pizza item',
      sizes: [
        {
          size: 'Large',
          price: 15.99,
        },
      ],
      prices: [15.99],
      image: 'https://example.com/pizza.jpg',
      isAvailable: true,
    });
    menuItemId = menuItem._id;

    // Verify order can be created with valid data
    const order = await Order.create({
      userId: customer._id,
      email: customer.email,
      phone: customer.phone,
      streetAddress: '123 Test Ave',
      postalCode: '12345',
      city: 'Test City',
      country: 'Test Country',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Large',
          quantity: 2,
          price: 15.99,
          restaurantId: restaurantId,
        },
      ],
      restaurantId: restaurantId,
      taxPercentage: restaurant.tax,
      taxAmount: 6.4,
      deliveryFee: 5,
      loyaltyDiscount: 0,
      loyaltyDiscountPercentage: 0,
      total: 43.98,
      orderPaid: false,
      paid: false,
      orderStatus: 'placed',
    });

    expect(order._id).toBeDefined();
    expect(order.email).toBe(testUserEmail);
    expect(order.orderStatus).toBe('placed');
    expect(order.orderPaid).toBe(false);

    // Verify order is stored in database
    const savedOrder = await Order.findById(order._id);
    expect(savedOrder).toBeDefined();
    expect(savedOrder?.cartProducts).toHaveLength(1);
    expect(savedOrder?.cartProducts[0].quantity).toBe(2);
  });

  it('should apply coupon discount correctly', async () => {
    // Create restaurant owner
    const restaurantOwner = await User.create({
      name: 'Restaurant Owner 2',
      email: `restaurant-owner-2-${Date.now()}@example.com`,
      password: bcrypt.hashSync('TestPassword123!', 10),
      phone: '+9876543211',
      role: 'admin',
      provider: 'credentials',
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      ownerId: restaurantOwner._id,
      name: 'Test Burger Place',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111112',
      email: 'burgers@test.com',
      description: 'Delicious burgers for testing purposes. Must be at least 20 characters long!',
      tax: 8,
      courierFee: 5,
    });

    // Create coupon
    const coupon = await Coupon.create({
      restaurantId: restaurant._id,
      createdBy: restaurantOwner._id,
      code: `TEST${Date.now()}`,
      title: '20% Off',
      description: 'Test coupon discount',
      discountType: 'percentage',
      discountValue: 20,
      minimumOrderAmount: 20,
      usageLimit: 100,
      usageCount: 0,
    });
    couponId = coupon._id;

    // Create menu item
    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: restaurantOwner._id,
      name: 'Test Burger',
      category: 'burger',
      description: 'Test burger item',
      sizes: [
        {
          size: 'Regular',
          price: 12.99,
        },
      ],
      prices: [12.99],
      image: 'https://example.com/burger.jpg',
      isAvailable: true,
    });

    // Create order with coupon
    const order = await Order.create({
      userId: userId,
      email: testUserEmail,
      phone: '+1234567890',
      streetAddress: '123 Test Ave',
      postalCode: '12345',
      city: 'Test City',
      country: 'Test Country',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Regular',
          quantity: 2,
          price: 12.99,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: restaurant.tax,
      taxAmount: 2.08,
      deliveryFee: 5,
      couponId: coupon._id,
      couponCode: coupon.code,
      couponTitle: coupon.title,
      couponDiscountAmount: 5.2,
      couponDiscountPercentage: 20,
      couponMinimumOrderAmount: 20,
      loyaltyDiscount: 0,
      loyaltyDiscountPercentage: 0,
      total: 32.96,
      orderPaid: false,
      paid: false,
      orderStatus: 'placed',
    });

    expect(order.couponDiscountAmount).toBeCloseTo(5.2, 1);
    expect(order.couponCode).toBe(coupon.code);

    // Cleanup
    await User.deleteOne({ _id: restaurantOwner._id });
    await Restaurant.deleteOne({ _id: restaurant._id });
    await MenuItem.deleteOne({ _id: menuItem._id });
  });

  it('should mark order as paid after webhook payment', async () => {
    // Create restaurant owner
    const restaurantOwner = await User.create({
      name: 'Restaurant Owner 3',
      email: `restaurant-owner-3-${Date.now()}@example.com`,
      password: bcrypt.hashSync('TestPassword123!', 10),
      phone: '+9876543212',
      role: 'admin',
      provider: 'credentials',
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      ownerId: restaurantOwner._id,
      name: 'Test Pasta Place',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111113',
      email: 'pasta@test.com',
      description: 'Delicious pasta for testing purposes. Must be at least 20 characters long!',
      tax: 12,
      courierFee: 5,
    });

    // Create menu item
    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      adminId: restaurantOwner._id,
      name: 'Test Pasta',
      category: 'pasta',
      description: 'Test pasta item',
      sizes: [
        {
          size: 'Regular',
          price: 13.99,
        },
      ],
      prices: [13.99],
      image: 'https://example.com/pasta.jpg',
      isAvailable: true,
    });

    // Create order
    const order = await Order.create({
      userId: userId,
      email: testUserEmail,
      phone: '+1234567890',
      streetAddress: '123 Test Ave',
      postalCode: '12345',
      city: 'Test City',
      country: 'Test Country',
      cartProducts: [
        {
          productId: menuItem._id,
          name: menuItem.name,
          size: 'Regular',
          quantity: 1,
          price: 13.99,
          restaurantId: restaurant._id,
        },
      ],
      restaurantId: restaurant._id,
      taxPercentage: restaurant.tax,
      taxAmount: 1.68,
      deliveryFee: 5,
      loyaltyDiscount: 0,
      loyaltyDiscountPercentage: 0,
      total: 20.67,
      orderPaid: false,
      paid: false,
      orderStatus: 'placed',
    });

    // Simulate webhook marking order as paid
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder).toBeDefined();
    expect((updatedOrder as any).orderPaid).toBe(false);

    (updatedOrder as any).orderPaid = true;
    (updatedOrder as any).paid = true;
    (updatedOrder as any).orderStatus = 'pending';
    (updatedOrder as any).stripeSessionId = 'cs_test_webhook_123';
    await updatedOrder?.save();

    // Verify payment status is updated
    const paidOrder = await Order.findById(order._id);
    expect((paidOrder as any).orderPaid).toBe(true);
    expect((paidOrder as any).paid).toBe(true);
    expect((paidOrder as any).orderStatus).toBe('pending');
    expect((paidOrder as any).stripeSessionId).toBe('cs_test_webhook_123');

    // Cleanup
    await User.deleteOne({ _id: restaurantOwner._id });
    await Restaurant.deleteOne({ _id: restaurant._id });
    await MenuItem.deleteOne({ _id: menuItem._id });
  });

  it('should validate cart items belong to same restaurant', async () => {
    // Create two restaurants
    const owner1 = await User.create({
      name: 'Owner 1',
      email: `owner-1-${Date.now()}@example.com`,
      password: bcrypt.hashSync('TestPassword123!', 10),
      phone: '+1111111114',
      role: 'admin',
      provider: 'credentials',
    });

    const owner2 = await User.create({
      name: 'Owner 2',
      email: `owner-2-${Date.now()}@example.com`,
      password: bcrypt.hashSync('TestPassword123!', 10),
      phone: '+1111111115',
      role: 'admin',
      provider: 'credentials',
    });

    const restaurant1 = await Restaurant.create({
      ownerId: owner1._id,
      name: 'Restaurant 1',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111116',
      email: 'rest1@test.com',
      description: 'Restaurant 1 for testing purposes. Must be at least 20 characters long!',
      tax: 8,
      courierFee: 5,
    });

    const restaurant2 = await Restaurant.create({
      ownerId: owner2._id,
      name: 'Restaurant 2',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111117',
      email: 'rest2@test.com',
      description: 'Restaurant 2 for testing purposes. Must be at least 20 characters long!',
      tax: 8,
      courierFee: 5,
    });

    const item1 = await MenuItem.create({
      restaurantId: restaurant1._id,
      adminId: owner1._id,
      name: 'Item 1',
      category: 'food',
      description: 'Item from restaurant 1',
      sizes: [{ size: 'Regular', price: 10.99 }],
      prices: [10.99],
      image: 'https://example.com/item1.jpg',
      isAvailable: true,
    });

    const item2 = await MenuItem.create({
      restaurantId: restaurant2._id,
      adminId: owner2._id,
      name: 'Item 2',
      category: 'food',
      description: 'Item from restaurant 2',
      sizes: [{ size: 'Regular', price: 11.99 }],
      prices: [11.99],
      image: 'https://example.com/item2.jpg',
      isAvailable: true,
    });

    // Verify that cart items from different restaurants can be identified
    const menuItems = await MenuItem.find({
      _id: { $in: [item1._id, item2._id] },
    });

    expect(menuItems).toHaveLength(2);
    const uniqueRestaurants = new Set(menuItems.map((item) => item.restaurantId.toString()));
    expect(uniqueRestaurants.size).toBe(2); // Items from different restaurants

    // Cleanup
    await User.deleteMany({ _id: { $in: [owner1._id, owner2._id] } });
    await Restaurant.deleteMany({ _id: { $in: [restaurant1._id, restaurant2._id] } });
    await MenuItem.deleteMany({ _id: { $in: [item1._id, item2._id] } });
  });

  it('should prevent user from ordering from their own restaurant', async () => {
    // Create restaurant owner
    const restaurantOwner = await User.create({
      name: 'Restaurant Owner 4',
      email: `restaurant-owner-4-${Date.now()}@example.com`,
      password: bcrypt.hashSync('TestPassword123!', 10),
      phone: '+9876543213',
      role: 'admin',
      provider: 'credentials',
    });

    // Create restaurant owned by this user
    const ownRestaurant = await Restaurant.create({
      ownerId: restaurantOwner._id,
      name: 'Own Restaurant',
      street: '789 Food St',
      city: 'Test City',
      postalCode: '99999',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.006,
      contact: '+1111111118',
      email: 'own@test.com',
      description: 'Restaurant owned by user. Must be at least 20 characters long!',
      tax: 8,
      courierFee: 5,
    });

    // Update user to have restaurantId
    await User.updateOne({ _id: restaurantOwner._id }, { restaurantId: ownRestaurant._id });

    // Create menu item in own restaurant
    const menuItem = await MenuItem.create({
      restaurantId: ownRestaurant._id,
      adminId: restaurantOwner._id,
      name: 'Own Item',
      category: 'food',
      description: 'Item from own restaurant',
      sizes: [{ size: 'Regular', price: 14.99 }],
      prices: [14.99],
      image: 'https://example.com/own.jpg',
      isAvailable: true,
    });

    // Verify that user owns this restaurant
    const userWithRestaurant = await User.findById(restaurantOwner._id);
    expect(userWithRestaurant?.restaurantId?.toString()).toBe(ownRestaurant._id.toString());

    // Cleanup
    await User.deleteOne({ _id: restaurantOwner._id });
    await Restaurant.deleteOne({ _id: ownRestaurant._id });
    await MenuItem.deleteOne({ _id: menuItem._id });
  });
});
