import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { Notification } from '@/models/notification';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { SupportTicket } from '@/models/supportTicket';
import { User } from '@/models/user';

let activeSession: any = null;
let originalSuperAdminEmail: string | undefined;
let originalPublicSuperAdminEmail: string | undefined;

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

const uniqueEmail = (label: string) =>
  `e2e-support-ticket-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

const setSession = (user: { email: string; role: string }) => {
  activeSession = { user: { email: user.email, role: user.role } };
};

const postTicket = async (body: Record<string, unknown>) => {
  const { POST } = await import('@/app/api/support-tickets/route');

  return POST(
    new Request('http://localhost/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
};

const patchTicket = async (body: Record<string, unknown>) => {
  const { PATCH } = await import('@/app/api/support-tickets/route');

  return PATCH(
    new Request('http://localhost/api/support-tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
};

const getTickets = async (query = '') => {
  const { GET } = await import('@/app/api/support-tickets/route');

  return GET(new Request(`http://localhost/api/support-tickets${query}`));
};

const createSupportFixture = async () => {
  const owner = await User.create({
    name: 'Support Ticket Owner',
    email: uniqueEmail('owner'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const superAdmin = await User.create({
    name: 'Support Ticket Super Admin',
    email: uniqueEmail('super-admin'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  process.env.SUPER_ADMIN_EMAIL = superAdmin.email;
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = superAdmin.email;

  const strangerAdmin = await User.create({
    name: 'Support Ticket Stranger Admin',
    email: uniqueEmail('stranger-admin'),
    password: 'x',
    provider: 'credentials',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Support Ticket Customer',
    email: uniqueEmail('customer'),
    password: 'x',
    provider: 'credentials',
    role: 'user',
  });

  const restaurant = await Restaurant.create({
    ownerId: owner._id,
    name: `E2E Support Ticket Restaurant ${Date.now()}`,
    street: '1 Test Street',
    city: 'Sarajevo',
    postalCode: '71000',
    country: 'BiH',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+38761111222',
    email: `support-ticket-${Date.now()}@example.com`,
    description: 'Restaurant used for support ticket e2e tests.',
    tax: 10,
    courierFee: 5,
  });

  owner.restaurantId = restaurant._id;
  await owner.save();

  const order = await Order.create({
    userId: customer._id,
    email: customer.email,
    phone: '+38761111111',
    streetAddress: 'Customer Street 1',
    postalCode: '71000',
    city: 'Sarajevo',
    country: 'BiH',
    cartProducts: [
      {
        productId: new mongoose.Types.ObjectId(),
        name: 'Support Ticket Pizza',
        size: 'single',
        quantity: 1,
        price: 20,
        restaurantId: restaurant._id,
      },
    ],
    restaurantId: restaurant._id,
    taxPercentage: 10,
    taxAmount: 2,
    deliveryFee: 5,
    total: 27,
    orderPaid: true,
    paid: true,
    orderStatus: 'completed',
  });

  return { customer, order, owner, restaurant, strangerAdmin, superAdmin };
};

describe('E2E: support tickets', () => {
  beforeAll(async () => {
    originalSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    originalPublicSuperAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await Notification.deleteMany({});
    await SupportTicket.deleteMany({ subject: /^E2E Support Ticket/i });
    await Order.deleteMany({ email: /e2e-support-ticket-/i });
    await Restaurant.deleteMany({ name: /^E2E Support Ticket/i });
    await User.deleteMany({ email: /e2e-support-ticket-/i });
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await SupportTicket.deleteMany({ subject: /^E2E Support Ticket/i });
    await Order.deleteMany({ email: /e2e-support-ticket-/i });
    await Restaurant.deleteMany({ name: /^E2E Support Ticket/i });
    await User.deleteMany({ email: /e2e-support-ticket-/i });

    if (originalSuperAdminEmail === undefined) {
      delete process.env.SUPER_ADMIN_EMAIL;
    } else {
      process.env.SUPER_ADMIN_EMAIL = originalSuperAdminEmail;
    }

    if (originalPublicSuperAdminEmail === undefined) {
      delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    } else {
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = originalPublicSuperAdminEmail;
    }

    await mongoose.disconnect();
  });

  it('routes restaurant support tickets to the owner and super admin, then notifies the reporter on status changes', async () => {
    const { customer, order, owner, strangerAdmin, superAdmin } = await createSupportFixture();

    setSession(customer);
    const createResponse = await postTicket({
      orderId: order._id.toString(),
      target: 'restaurant_support',
      category: 'missing_item',
      priority: 'high',
      subject: 'E2E Support Ticket missing item',
      description: 'The order arrived without one item from the receipt.',
      contactEmail: 'customer-support@example.com',
      contactPhone: '+38761123456',
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.ticket.status).toBe('open');
    expect(createBody.ticket.target).toBe('restaurant_support');
    expect(createBody.ticket.contactPhone).toBe('+38761123456');

    const ownerNotification = await Notification.findOne({
      recipientUserId: owner._id,
      orderId: order._id,
      type: 'support_ticket',
      title: 'New restaurant problem report',
    }).lean();
    const superAdminNotification = await Notification.findOne({
      recipientUserId: superAdmin._id,
      orderId: order._id,
      type: 'support_ticket',
      title: 'New restaurant problem report',
    }).lean();

    expect(ownerNotification?.metadata?.ticketId).toBe(createBody.ticket._id.toString());
    expect(superAdminNotification?.metadata?.ticketId).toBe(createBody.ticket._id.toString());

    setSession(strangerAdmin);
    const blockedResponse = await patchTicket({
      ticketId: createBody.ticket._id.toString(),
      status: 'in_review',
    });
    expect(blockedResponse.status).toBe(403);

    setSession(owner);
    const reviewResponse = await patchTicket({
      ticketId: createBody.ticket._id.toString(),
      status: 'in_review',
      responseNote: 'We are checking the kitchen receipt.',
    });
    const reviewBody = await reviewResponse.json();

    expect(reviewResponse.status).toBe(200);
    expect(reviewBody.ticket.status).toBe('in_review');
    expect(reviewBody.ticket.responseNote).toBe('We are checking the kitchen receipt.');

    await expect(
      Notification.findOne({
        recipientUserId: customer._id,
        orderId: order._id,
        title: 'Problem report in review',
      })
    ).resolves.toBeTruthy();

    setSession(customer);
    const customerTicketsResponse = await getTickets();
    const customerTicketsBody = await customerTicketsResponse.json();
    expect(customerTicketsResponse.status).toBe(200);
    expect(customerTicketsBody.tickets).toHaveLength(1);
    expect(customerTicketsBody.tickets[0]._id.toString()).toBe(createBody.ticket._id.toString());

    setSession(owner);
    const resolvedResponse = await patchTicket({
      ticketId: createBody.ticket._id.toString(),
      status: 'resolved',
      responseNote: 'Replacement item confirmed with the customer.',
    });
    const resolvedBody = await resolvedResponse.json();

    expect(resolvedResponse.status).toBe(200);
    expect(resolvedBody.ticket.status).toBe('resolved');
    expect(resolvedBody.ticket.resolvedAt).toBeTruthy();
  });

  it('routes app support tickets to super admins without exposing them to restaurant owners', async () => {
    const { customer, owner, superAdmin } = await createSupportFixture();

    setSession(customer);
    const createResponse = await postTicket({
      target: 'app_support',
      category: 'app_issue',
      priority: 'normal',
      subject: 'E2E Support Ticket app issue',
      description: 'The customer needs help with an app-level issue.',
      contactEmail: 'customer-support@example.com',
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.ticket.target).toBe('app_support');
    expect(createBody.ticket.restaurantId).toBeNull();

    await expect(
      Notification.findOne({
        recipientUserId: superAdmin._id,
        type: 'support_ticket',
        title: 'New app support report',
      })
    ).resolves.toBeTruthy();

    setSession(owner);
    const ownerTicketsResponse = await getTickets();
    const ownerTicketsBody = await ownerTicketsResponse.json();
    expect(ownerTicketsResponse.status).toBe(200);
    expect(ownerTicketsBody.tickets).toHaveLength(0);

    setSession(superAdmin);
    const superAdminTicketsResponse = await getTickets();
    const superAdminTicketsBody = await superAdminTicketsResponse.json();
    expect(superAdminTicketsResponse.status).toBe(200);
    expect(
      superAdminTicketsBody.tickets.some(
        (ticket: any) => ticket._id.toString() === createBody.ticket._id.toString()
      )
    ).toBe(true);
  });
});
