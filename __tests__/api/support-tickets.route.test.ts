import { getServerSession } from 'next-auth/next';
import {
  notifySupportTicketCreated,
  notifySupportTicketReporterAboutStatus,
} from '@/libs/notifications';
import { Order } from '@/models/order';
import { SupportTicket } from '@/models/supportTicket';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/authOptions', () => ({
  authOptions: {},
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn(() => true),
      },
    },
  },
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/supportTicket', () => ({
  SupportTicket: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/libs/notifications', () => ({
  notifySupportTicketCreated: vi.fn(),
  notifySupportTicketReporterAboutStatus: vi.fn(),
}));

const loadRoute = async () => import('@/app/api/support-tickets/route');

const createObjectId = (value: string) => ({
  toString: () => value,
});

const createTicketQuery = (result: unknown) => {
  const query = {
    limit: vi.fn(() => query),
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    lean: vi.fn().mockResolvedValue(result),
  };

  return query;
};

const createRequest = (url: string, body?: Record<string, unknown>) =>
  new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

describe('/api/support-tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.SUPER_ADMIN_EMAIL;
    delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'customer@example.com' },
    } as never);

    vi.mocked(User.findOne).mockResolvedValue({
      _id: createObjectId('user-1'),
      name: 'Customer',
      email: 'customer@example.com',
      role: 'user',
      restaurantId: null,
    } as never);
  });

  it('returns only tickets reported by the signed-in customer', async () => {
    const tickets = [{ _id: 'ticket-1', subject: 'Missing item' }];
    const query = createTicketQuery(tickets);
    vi.mocked(SupportTicket.find).mockReturnValue(query as never);

    const { GET } = await loadRoute();
    const response = await GET(new Request('http://localhost/api/support-tickets'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ tickets });
    expect(SupportTicket.find).toHaveBeenCalledWith({
      reporterId: expect.objectContaining({ toString: expect.any(Function) }),
    });
    expect(query.limit).toHaveBeenCalledWith(100);
  });

  it('normalizes legacy closed tickets as resolved', async () => {
    const query = createTicketQuery([{ _id: 'ticket-1', subject: 'Handled', status: 'closed' }]);
    vi.mocked(SupportTicket.find).mockReturnValue(query as never);

    const { GET } = await loadRoute();
    const response = await GET(new Request('http://localhost/api/support-tickets'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tickets).toEqual([{ _id: 'ticket-1', subject: 'Handled', status: 'resolved' }]);
  });

  it('scopes restaurant admins to restaurant support tickets for their restaurant', async () => {
    const restaurantId = createObjectId('restaurant-1');
    const query = createTicketQuery([]);

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: createObjectId('admin-1'),
      email: 'admin@example.com',
      role: 'admin',
      restaurantId,
    } as never);
    vi.mocked(SupportTicket.find).mockReturnValue(query as never);

    const { GET } = await loadRoute();
    const response = await GET(new Request('http://localhost/api/support-tickets?status=open'));

    expect(response.status).toBe(200);
    expect(SupportTicket.find).toHaveBeenCalledWith({
      status: 'open',
      restaurantId,
      target: 'restaurant_support',
    });
  });

  it('creates a restaurant support ticket for the order owner and sends a notification', async () => {
    const userId = createObjectId('user-1');
    const orderId = createObjectId('order-1');
    const restaurantId = createObjectId('restaurant-1');
    const ticket = { _id: createObjectId('ticket-1') };
    const populatedTicket = { _id: 'ticket-1', subject: 'Wrong pizza size' };
    const query = createTicketQuery(populatedTicket);

    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: userId,
      name: 'Customer',
      email: 'customer@example.com',
      role: 'user',
      restaurantId: null,
    } as never);
    vi.mocked(Order.findById).mockResolvedValueOnce({
      _id: orderId,
      userId,
      restaurantId,
    } as never);
    vi.mocked(SupportTicket.create).mockResolvedValueOnce(ticket as never);
    vi.mocked(SupportTicket.findById).mockReturnValueOnce(query as never);

    const { POST } = await loadRoute();
    const response = await POST(
      createRequest('http://localhost/api/support-tickets', {
        orderId: 'order-1',
        target: 'restaurant_support',
        category: 'wrong_item',
        priority: 'high',
        subject: 'Wrong pizza size',
        description: 'I ordered large pizza but received a small one.',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ ticket: populatedTicket });
    expect(SupportTicket.create).toHaveBeenCalledWith({
      reporterId: userId,
      reporterRole: 'user',
      reporterName: 'Customer',
      reporterEmail: 'customer@example.com',
      contactEmail: 'customer@example.com',
      contactPhone: '',
      orderId,
      restaurantId,
      target: 'restaurant_support',
      category: 'wrong_item',
      priority: 'high',
      subject: 'Wrong pizza size',
      description: 'I ordered large pizza but received a small one.',
    });
    expect(notifySupportTicketCreated).toHaveBeenCalledWith({
      ticketId: ticket._id,
      orderId,
      restaurantId,
      reporterEmail: 'customer@example.com',
      target: 'restaurant_support',
      subject: 'Wrong pizza size',
    });
  });

  it('lets an admin report their own customer order from another restaurant', async () => {
    const adminId = createObjectId('admin-1');
    const adminRestaurantId = createObjectId('admin-restaurant');
    const orderRestaurantId = createObjectId('order-restaurant');
    const orderId = createObjectId('order-1');
    const ticket = { _id: createObjectId('ticket-1') };
    const populatedTicket = { _id: 'ticket-1', subject: 'One extra pizza' };
    const query = createTicketQuery(populatedTicket);

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: adminId,
      name: 'Admin Customer',
      email: 'admin@example.com',
      role: 'admin',
      restaurantId: adminRestaurantId,
    } as never);
    vi.mocked(Order.findById).mockResolvedValueOnce({
      _id: orderId,
      userId: adminId,
      restaurantId: orderRestaurantId,
    } as never);
    vi.mocked(SupportTicket.create).mockResolvedValueOnce(ticket as never);
    vi.mocked(SupportTicket.findById).mockReturnValueOnce(query as never);

    const { POST } = await loadRoute();
    const response = await POST(
      createRequest('http://localhost/api/support-tickets', {
        orderId: 'order-1',
        target: 'restaurant_support',
        category: 'order_issue',
        subject: 'One extra pizza',
        description: 'I accidentally ordered one extra pizza.',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ ticket: populatedTicket });
    expect(SupportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: adminId,
        reporterRole: 'admin',
        contactEmail: 'admin@example.com',
        contactPhone: '',
        orderId,
        restaurantId: orderRestaurantId,
      })
    );
  });

  it('rejects reports for orders that do not belong to the signed-in user', async () => {
    vi.mocked(Order.findById).mockResolvedValueOnce({
      _id: createObjectId('order-1'),
      userId: createObjectId('other-user'),
      restaurantId: createObjectId('restaurant-1'),
    } as never);

    const { POST } = await loadRoute();
    const response = await POST(
      createRequest('http://localhost/api/support-tickets', {
        orderId: 'order-1',
        subject: 'Missing fries',
        description: 'The order belongs to another customer.',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'You cannot report this order' });
    expect(SupportTicket.create).not.toHaveBeenCalled();
    expect(notifySupportTicketCreated).not.toHaveBeenCalled();
  });

  it('lets a restaurant admin resolve a ticket for their own restaurant', async () => {
    const adminId = createObjectId('admin-1');
    const restaurantId = createObjectId('restaurant-1');
    const save = vi.fn().mockResolvedValue(undefined);
    const ticket = {
      _id: createObjectId('ticket-1'),
      reporterId: createObjectId('user-1'),
      orderId: createObjectId('order-1'),
      target: 'restaurant_support',
      restaurantId,
      subject: 'Missing item',
      status: 'open',
      responseNote: '',
      resolvedBy: null,
      resolvedAt: null,
      save,
    };
    const updatedTicket = { _id: 'ticket-1', status: 'resolved' };
    const query = createTicketQuery(updatedTicket);

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: adminId,
      email: 'admin@example.com',
      role: 'admin',
      restaurantId,
    } as never);
    vi.mocked(SupportTicket.findById)
      .mockResolvedValueOnce(ticket as never)
      .mockReturnValueOnce(query as never);

    const { PATCH } = await loadRoute();
    const response = await PATCH(
      new Request('http://localhost/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 'ticket-1',
          status: 'resolved',
          responseNote: 'We refunded the missing item manually.',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ticket: updatedTicket });
    expect(ticket.status).toBe('resolved');
    expect(ticket.responseNote).toBe('We refunded the missing item manually.');
    expect(ticket.resolvedBy).toBe(adminId);
    expect(ticket.resolvedAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
    expect(notifySupportTicketReporterAboutStatus).toHaveBeenCalledWith({
      reporterId: ticket.reporterId,
      ticketId: ticket._id,
      orderId: ticket.orderId,
      status: 'resolved',
      subject: 'Missing item',
    });
  });

  it('blocks restaurant admins from updating app support tickets', async () => {
    const restaurantId = createObjectId('restaurant-1');
    const save = vi.fn();

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: createObjectId('admin-1'),
      email: 'admin@example.com',
      role: 'admin',
      restaurantId,
    } as never);
    vi.mocked(SupportTicket.findById).mockResolvedValueOnce({
      _id: createObjectId('ticket-1'),
      target: 'app_support',
      restaurantId,
      save,
    } as never);

    const { PATCH } = await loadRoute();
    const response = await PATCH(
      new Request('http://localhost/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 'ticket-1',
          status: 'resolved',
          responseNote: 'Handled by app support.',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'You cannot update this ticket' });
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects closed as a support ticket status', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com' },
    } as never);
    vi.mocked(User.findOne).mockResolvedValueOnce({
      _id: createObjectId('admin-1'),
      email: 'admin@example.com',
      role: 'admin',
      restaurantId: createObjectId('restaurant-1'),
    } as never);

    const { PATCH } = await loadRoute();
    const response = await PATCH(
      new Request('http://localhost/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 'ticket-1',
          status: 'closed',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid ticket status' });
    expect(SupportTicket.findById).not.toHaveBeenCalled();
  });
});
