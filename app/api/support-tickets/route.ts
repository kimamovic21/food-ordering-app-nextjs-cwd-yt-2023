import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/libs/authOptions';
import { notifySupportTicketCreated } from '@/libs/notifications';
import { Order } from '@/models/order';
import { SupportTicket } from '@/models/supportTicket';
import { User } from '@/models/user';

const validTargets = ['restaurant_support', 'app_support'] as const;
const validCategories = [
  'order_issue',
  'delivery_issue',
  'food_quality',
  'missing_item',
  'wrong_item',
  'courier_issue',
  'app_issue',
  'other',
] as const;
const validStatuses = ['open', 'in_review', 'resolved', 'closed'] as const;
const validPriorities = ['low', 'normal', 'high'] as const;

const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return User.findOne({ email: session.user.email });
};

const isSuperAdminUser = (user: any) => {
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  return Boolean(user?.role === 'admin' && superAdminEmail && user.email === superAdminEmail);
};

const canAccessOrder = (user: any, order: any) => {
  if (user.role === 'admin') {
    return (
      isSuperAdminUser(user) ||
      (user.restaurantId && order.restaurantId?.toString() === user.restaurantId.toString())
    );
  }

  if (user.role === 'courier') {
    return order.courierId?.toString() === user._id.toString();
  }

  return order.userId?.toString() === user._id.toString();
};

const populateTicketQuery = (query: any) =>
  query
    .populate('reporterId', 'name email role image')
    .populate('restaurantId', 'name')
    .populate('orderId', 'email orderStatus total createdAt')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const ticketId = url.searchParams.get('ticketId');
  const filter: Record<string, unknown> = {};

  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    filter.status = status;
  }

  if (ticketId) {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return Response.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }
    filter._id = ticketId;
  }

  if (user.role === 'admin') {
    if (!isSuperAdminUser(user)) {
      if (!user.restaurantId) {
        return Response.json({ error: 'Admin is not assigned to a restaurant' }, { status: 403 });
      }
      filter.restaurantId = user.restaurantId;
      filter.target = 'restaurant_support';
    }
  } else {
    filter.reporterId = user._id;
  }

  const tickets = await populateTicketQuery(SupportTicket.find(filter).limit(100)).lean();

  return Response.json({ tickets });
}

export async function POST(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  const target = validTargets.includes(body.target) ? body.target : 'restaurant_support';
  const category = validCategories.includes(body.category) ? body.category : 'order_issue';
  const priority = validPriorities.includes(body.priority) ? body.priority : 'normal';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (subject.length < 4 || subject.length > 120) {
    return Response.json(
      { error: 'Subject must be between 4 and 120 characters' },
      { status: 400 }
    );
  }

  if (description.length < 10 || description.length > 1000) {
    return Response.json(
      { error: 'Description must be between 10 and 1000 characters' },
      { status: 400 }
    );
  }

  let order: any = null;
  let restaurantId = user.role === 'admin' ? user.restaurantId : null;

  if (orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    order = await Order.findById(orderId);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!canAccessOrder(user, order)) {
      return Response.json({ error: 'You cannot report this order' }, { status: 403 });
    }

    restaurantId = order.restaurantId;
  }

  if (target === 'restaurant_support' && !restaurantId) {
    return Response.json(
      { error: 'Restaurant support reports must be connected to an order or restaurant' },
      { status: 400 }
    );
  }

  const ticket = await SupportTicket.create({
    reporterId: user._id,
    reporterRole: user.role,
    reporterName: user.name || '',
    reporterEmail: user.email,
    orderId: order?._id || null,
    restaurantId: restaurantId || null,
    target,
    category,
    priority,
    subject,
    description,
  });

  try {
    await notifySupportTicketCreated({
      ticketId: ticket._id,
      orderId: order?._id || null,
      restaurantId: restaurantId || null,
      reporterEmail: user.email,
      target,
      subject,
    });
  } catch (notificationError) {
    console.error('Failed to create support ticket notification:', notificationError);
  }

  const populatedTicket = await populateTicketQuery(SupportTicket.findById(ticket._id)).lean();

  return Response.json({ ticket: populatedTicket }, { status: 201 });
}

export async function PATCH(request: Request) {
  await mongoose.connect(process.env.MONGODB_URL as string);

  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Only admins can update support tickets' }, { status: 403 });
  }

  const body = await request.json();
  const ticketId = typeof body.ticketId === 'string' ? body.ticketId : '';
  const status = typeof body.status === 'string' ? body.status : '';
  const responseNote = typeof body.responseNote === 'string' ? body.responseNote.trim() : '';

  if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    return Response.json({ error: 'Invalid ticket ID' }, { status: 400 });
  }

  if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
    return Response.json({ error: 'Invalid ticket status' }, { status: 400 });
  }

  if (responseNote.length > 1000) {
    return Response.json(
      { error: 'Response note cannot be longer than 1000 characters' },
      { status: 400 }
    );
  }

  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    return Response.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (
    !isSuperAdminUser(user) &&
    (!user.restaurantId ||
      ticket.target !== 'restaurant_support' ||
      ticket.restaurantId?.toString() !== user.restaurantId.toString())
  ) {
    return Response.json({ error: 'You cannot update this ticket' }, { status: 403 });
  }

  ticket.status = status;
  ticket.responseNote = responseNote;

  if (status === 'resolved' || status === 'closed') {
    ticket.resolvedBy = user._id;
    ticket.resolvedAt = new Date();
  } else {
    ticket.resolvedBy = null;
    ticket.resolvedAt = null;
  }

  await ticket.save();

  const updatedTicket = await populateTicketQuery(SupportTicket.findById(ticket._id)).lean();

  return Response.json({ ticket: updatedTicket });
}
