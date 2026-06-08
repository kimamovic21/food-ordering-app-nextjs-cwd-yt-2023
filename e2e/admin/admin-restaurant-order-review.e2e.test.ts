import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { Category } from '@/models/category';
import { Coupon } from '@/models/coupon';
import { CourierReview } from '@/models/courierReview';
import { MenuItem } from '@/models/menuItem';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { RestaurantReview } from '@/models/restaurantReview';
import { User } from '@/models/user';

let activeSession: any = null;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(async () => activeSession?.user?.role === 'admin'),
  isSuperAdmin: vi.fn(async () => activeSession?.user?.email === process.env.SUPER_ADMIN_EMAIL),
}));

vi.mock('@/libs/cloudinary', () => ({
  default: {
    uploader: {
      destroy: vi.fn(),
      upload_stream: vi.fn(),
    },
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifyUserAboutOrderStatusChange: vi.fn(),
  notifyUserAboutCourierAssignment: vi.fn(),
  notifyCourierAboutAssignment: vi.fn(),
}));

const uniqueEmail = (label: string) =>
  `e2e-admin-flow-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string; role: string }) => {
  activeSession = { user: { email: user.email, role: user.role } };
  vi.mocked(getServerSession).mockClear();
};

const restaurantPayload = {
  name: `e2e-admin-flow-restaurant-${Date.now()}`,
  street: '1 Integration Street',
  city: 'Sarajevo',
  postalCode: '71000',
  country: 'BA',
  latitude: 43.8563,
  longitude: 18.4131,
  contact: '+38761123456',
  email: `restaurant-${Date.now()}@example.com`,
  webAddress: 'https://example.com',
  description: 'Restaurant created by admin lifecycle e2e coverage.',
  tax: 10,
  courierFee: 5,
  totalEmployees: 4,
  images: ['https://res.cloudinary.com/demo/image/upload/restaurants/e2e-admin-flow.jpg'],
};

const postJson = (url: string, body: Record<string, unknown>) =>
  new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const futureCouponDates = () => {
  const startsAt = new Date(Date.now() - 60_000);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);

  return {
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

describe('E2E: admin restaurant, coupon, order, and review lifecycle', () => {
  let admin: any;
  let customer: any;
  let courier: any;
  let category: any;
  let restaurantId: string;
  let menuItemId: string;
  let orderId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await User.deleteMany({ email: /e2e-admin-flow-/i });
    await Restaurant.deleteMany({ name: /e2e-admin-flow-/i });
    await Category.deleteMany({ name: /e2e-admin-flow-/i });
    await MenuItem.deleteMany({ name: /e2e-admin-flow-/i });
    await Coupon.deleteMany({ code: /^E2EFLOW/i });
    await Order.deleteMany({ email: /e2e-admin-flow-/i });
    await RestaurantReview.deleteMany({});
    await CourierReview.deleteMany({});

    admin = await User.create({
      name: 'E2E Admin',
      email: uniqueEmail('admin'),
      password: 'hashed',
      provider: 'credentials',
      role: 'admin',
    });

    customer = await User.create({
      name: 'E2E Customer',
      email: uniqueEmail('customer'),
      password: 'hashed',
      provider: 'credentials',
      role: 'user',
    });

    courier = await User.create({
      name: 'E2E Courier',
      email: uniqueEmail('courier'),
      password: 'hashed',
      provider: 'credentials',
      role: 'courier',
    });

    category = await Category.create({
      name: `e2e-admin-flow-category-${Date.now()}`,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-admin-flow-/i });
    await Restaurant.deleteMany({ name: /e2e-admin-flow-/i });
    await Category.deleteMany({ name: /e2e-admin-flow-/i });
    await MenuItem.deleteMany({ name: /e2e-admin-flow-/i });
    await Coupon.deleteMany({ code: /^E2EFLOW/i });
    await Order.deleteMany({ email: /e2e-admin-flow-/i });
    await RestaurantReview.deleteMany({});
    await CourierReview.deleteMany({});
    await mongoose.disconnect();
  });

  it('covers admin catalog setup, coupon validation, order status, and post-order reviews', async () => {
    setSession(admin);

    const { POST: CreateRestaurant } = await import('@/app/api/restaurant/route');
    const restaurantResponse = await CreateRestaurant(
      postJson('http://localhost/api/restaurant', restaurantPayload) as any
    );
    const restaurantBody = await restaurantResponse.json();

    expect(restaurantResponse.status).toBe(201);
    restaurantId = restaurantBody.restaurant._id.toString();

    const adminAfterRestaurant = await User.findById(admin._id);
    expect(adminAfterRestaurant?.restaurantId?.toString()).toBe(restaurantId);

    const { POST: CreateMenuItem, GET: GetMenuItems } = await import('@/app/api/menu-items/route');
    const menuResponse = await CreateMenuItem(
      postJson('http://localhost/api/menu-items', {
        name: `e2e-admin-flow-menu-${Date.now()}`,
        description: 'Menu item created through route e2e flow.',
        image: 'https://example.com/menu.jpg',
        category: category._id.toString(),
        priceType: 'double',
        priceSmall: '9.50',
        priceMedium: '12.50',
      })
    );
    const menuBody = await menuResponse.json();

    expect(menuResponse.status).toBe(200);
    menuItemId = menuBody._id.toString();
    expect(menuBody.restaurantId.toString()).toBe(restaurantId);

    const searchResponse = await GetMenuItems(
      new Request(
        `http://localhost/api/menu-items?q=e2e-admin-flow&categories=${encodeURIComponent(
          category.name
        )}&minPrice=8&maxPrice=20&sort=price_asc`
      )
    );
    const searchBody = await searchResponse.json();
    expect(searchResponse.status).toBe(200);
    expect(searchBody.total).toBeGreaterThanOrEqual(1);

    const { POST: CreateCoupon, GET: GetCoupon } = await import('@/app/api/coupons/route');
    const couponCode = `E2EFLOW${Date.now()}`;
    const dates = futureCouponDates();
    const createCouponResponse = await CreateCoupon(
      postJson('http://localhost/api/coupons', {
        code: couponCode,
        title: 'E2E Flow Discount',
        description: 'Discount used by lifecycle coverage.',
        discountValue: 15,
        minimumOrderAmount: 20,
        startsAt: dates.startsAt,
        expiresAt: dates.expiresAt,
      })
    );
    expect(createCouponResponse.status).toBe(201);

    activeSession = null;
    const validateCouponResponse = await GetCoupon(
      new Request(
        `http://localhost/api/coupons?code=${couponCode.toLowerCase()}&restaurantId=${restaurantId}&subtotal=50`
      )
    );
    const validateCouponBody = await validateCouponResponse.json();
    expect(validateCouponResponse.status).toBe(200);
    expect(validateCouponBody.valid).toBe(true);
    expect(validateCouponBody.discountAmount).toBe(7.5);

    const order = await Order.create({
      userId: customer._id,
      email: customer.email,
      phone: '+38761111111',
      streetAddress: 'Customer Street 2',
      postalCode: '71000',
      city: 'Sarajevo',
      country: 'BA',
      cartProducts: [
        {
          productId: menuItemId,
          name: menuBody.name,
          size: 'Medium',
          quantity: 2,
          price: 12.5,
          restaurantId,
        },
      ],
      restaurantId,
      courierId: courier._id,
      taxPercentage: 10,
      taxAmount: 2.5,
      deliveryFee: 5,
      couponCode,
      couponDiscountAmount: 7.5,
      total: 25,
      orderPaid: true,
      paid: true,
      orderStatus: 'processing',
    });
    orderId = order._id.toString();

    setSession(admin);
    const { PATCH: UpdateOrder } = await import('@/app/api/orders/route');
    const updateOrderResponse = await UpdateOrder(
      new Request('http://localhost/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, orderStatus: 'ready' }),
      })
    );
    const updateOrderBody = await updateOrderResponse.json();
    expect(updateOrderResponse.status).toBe(200);
    expect(updateOrderBody.order.orderStatus).toBe('ready');

    await Order.findByIdAndUpdate(orderId, { orderStatus: 'completed' });

    setSession(customer);
    const { POST: CreateRestaurantReview } = await import('@/app/api/reviews/route');
    const restaurantReviewResponse = await CreateRestaurantReview(
      postJson('http://localhost/api/reviews', {
        orderId,
        rating: 5,
        reviewText: 'Excellent restaurant experience.',
      })
    );
    expect(restaurantReviewResponse.status).toBe(200);

    const { POST: CreateCourierReview } = await import('@/app/api/courier-reviews/route');
    const courierReviewResponse = await CreateCourierReview(
      postJson('http://localhost/api/courier-reviews', {
        orderId,
        rating: 4,
        reviewText: 'Courier arrived quickly.',
      })
    );
    expect(courierReviewResponse.status).toBe(200);

    expect(await RestaurantReview.countDocuments({ orderId })).toBe(1);
    expect(await CourierReview.countDocuments({ orderId })).toBe(1);
  });
});
