import { getServerSession } from 'next-auth/next';
import { Conversation } from '@/models/conversation';
import { Message } from '@/models/message';
import { Order } from '@/models/order';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import mongoose from 'mongoose';

let activeSession: any = null;

vi.mock('server-only', () => ({}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => activeSession),
}));

const uniqueEmail = (label: string) => `e2e-messages-${label}-${Date.now()}@example.com`;

const createUser = (label: string, role: 'user' | 'admin' | 'courier') =>
  User.create({
    name: `Messages ${label}`,
    email: uniqueEmail(label),
    password: 'password',
    provider: 'credentials',
    role,
  });

const setSession = (user: { email: string; role: string }) => {
  activeSession = { user: { email: user.email, role: user.role } };
  vi.mocked(getServerSession).mockClear();
};

const createRestaurant = (ownerId: mongoose.Types.ObjectId) =>
  Restaurant.create({
    ownerId,
    name: `e2e-messages-rest-${Date.now()}`,
    street: '1 Test Street',
    city: 'Test City',
    postalCode: '10000',
    country: 'Test Country',
    latitude: 43.8563,
    longitude: 18.4131,
    contact: '+123456789',
    email: `restaurant-${Date.now()}@example.com`,
    description: 'Restaurant used for messages end-to-end testing.',
    tax: 10,
    courierFee: 5,
  });

const createOrder = async (params: { customer: any; courier?: any; restaurant: any }) =>
  Order.create({
    userId: params.customer._id,
    email: params.customer.email,
    phone: '123456789',
    streetAddress: '1 Customer Street',
    postalCode: '10000',
    city: 'Test City',
    country: 'Test Country',
    cartProducts: [
      {
        productId: new mongoose.Types.ObjectId(),
        name: 'Test Pizza',
        size: 'Regular',
        quantity: 1,
        price: 12,
        restaurantId: params.restaurant._id,
      },
    ],
    restaurantId: params.restaurant._id,
    taxPercentage: 10,
    taxAmount: 1.2,
    deliveryFee: 5,
    total: 18.2,
    orderPaid: true,
    orderStatus: 'transportation',
    courierId: params.courier?._id || null,
  });

const postMessage = (body: Record<string, unknown>) =>
  import('@/app/api/messages/route').then(({ POST }) =>
    POST(
      new Request('http://localhost/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
  );

const patchMessage = (body: Record<string, unknown>) =>
  import('@/app/api/messages/route').then(({ PATCH }) =>
    PATCH(
      new Request('http://localhost/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
  );

const getMessages = (url: string) =>
  import('@/app/api/messages/route').then(({ GET }) => GET(new Request(url)));

describe('E2E: messages flow', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    activeSession = null;
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await Order.deleteMany({});
    await Restaurant.deleteMany({ name: /e2e-messages-rest-/i });
    await User.deleteMany({ email: /e2e-messages-/i });
  });

  afterAll(async () => {
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await Order.deleteMany({});
    await Restaurant.deleteMany({ name: /e2e-messages-rest-/i });
    await User.deleteMany({ email: /e2e-messages-/i });
    await mongoose.disconnect();
  });

  it('lets a customer and assigned courier exchange an order-thread message', async () => {
    const customer = await createUser('customer', 'user');
    const courier = await createUser('courier', 'courier');
    const owner = await createUser('owner', 'admin');
    const restaurant = await createRestaurant(owner._id);
    const order = await createOrder({ customer, courier, restaurant });

    setSession(customer);
    const sendResponse = await postMessage({
      recipientUserId: courier._id.toString(),
      orderId: order._id.toString(),
      context: 'order',
      text: 'Please call when you arrive.',
    });
    const sendBody = await sendResponse.json();

    expect(sendResponse.status).toBe(200);
    expect(sendBody.success).toBe(true);
    expect(sendBody.message.body).toBe('Please call when you arrive.');

    const conversation = await Conversation.findById(sendBody.conversationId);
    expect(conversation?.contextType).toBe('order');
    expect(conversation?.orderId?.toString()).toBe(order._id.toString());

    setSession(courier);
    const inboxResponse = await getMessages('http://localhost/api/messages');
    const inboxBody = await inboxResponse.json();
    expect(inboxResponse.status).toBe(200);
    expect(inboxBody.unreadCount).toBe(1);

    const threadResponse = await getMessages(
      `http://localhost/api/messages?participantId=${customer._id.toString()}&orderId=${order._id.toString()}&context=order`
    );
    const threadBody = await threadResponse.json();
    expect(threadResponse.status).toBe(200);
    expect(threadBody.selectedConversation.messages).toHaveLength(1);
    expect(threadBody.selectedConversation.messages[0].deliveredAt).toEqual(expect.any(String));

    const seenResponse = await patchMessage({
      action: 'mark-seen',
      conversationId: sendBody.conversationId,
    });
    const seenBody = await seenResponse.json();
    expect(seenResponse.status).toBe(200);
    expect(seenBody.unreadCount).toBe(0);

    const savedMessage = await Message.findById(sendBody.message._id);
    expect(savedMessage?.seenAt).toBeInstanceOf(Date);
    expect(savedMessage?.deliveredAt).toBeInstanceOf(Date);
  });

  it('blocks order conversations when the courier is not assigned to that order', async () => {
    const customer = await createUser('blocked-customer', 'user');
    const assignedCourier = await createUser('assigned-courier', 'courier');
    const unrelatedCourier = await createUser('unrelated-courier', 'courier');
    const owner = await createUser('blocked-owner', 'admin');
    const restaurant = await createRestaurant(owner._id);
    const order = await createOrder({ customer, courier: assignedCourier, restaurant });

    setSession(customer);
    const response = await postMessage({
      recipientUserId: unrelatedCourier._id.toString(),
      orderId: order._id.toString(),
      context: 'order',
      text: 'This should not be allowed.',
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'This order conversation is not allowed' });
    expect(await Conversation.countDocuments({})).toBe(0);
    expect(await Message.countDocuments({})).toBe(0);
  });

  it('allows direct admin-to-courier chat but blocks customer-to-customer direct chat', async () => {
    const admin = await createUser('admin-direct', 'admin');
    const courier = await createUser('courier-direct', 'courier');
    const firstCustomer = await createUser('first-customer-direct', 'user');
    const secondCustomer = await createUser('second-customer-direct', 'user');

    setSession(admin);
    const allowedResponse = await postMessage({
      recipientUserId: courier._id.toString(),
      text: 'Can you cover the next delivery?',
    });
    const allowedBody = await allowedResponse.json();

    expect(allowedResponse.status).toBe(200);
    expect(allowedBody.message.body).toBe('Can you cover the next delivery?');

    setSession(firstCustomer);
    const blockedResponse = await postMessage({
      recipientUserId: secondCustomer._id.toString(),
      text: 'Customer-to-customer chat should stay closed.',
    });
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(403);
    expect(blockedBody).toEqual({ error: 'This conversation is not allowed' });
  });

  it('lets senders edit their own messages and hides deleted messages only for that viewer', async () => {
    const admin = await createUser('admin-edit', 'admin');
    const courier = await createUser('courier-edit', 'courier');

    setSession(admin);
    const sendResponse = await postMessage({
      recipientUserId: courier._id.toString(),
      text: 'Original dispatch note',
    });
    const sendBody = await sendResponse.json();

    const editResponse = await patchMessage({
      action: 'edit-message',
      conversationId: sendBody.conversationId,
      messageId: sendBody.message._id,
      text: 'Updated dispatch note',
    });
    expect(editResponse.status).toBe(200);

    const editedMessage = await Message.findById(sendBody.message._id);
    expect(editedMessage?.body).toBe('Updated dispatch note');
    expect(editedMessage?.editedByUserId?.toString()).toBe(admin._id.toString());

    setSession(courier);
    const unauthorizedEditResponse = await patchMessage({
      action: 'edit-message',
      conversationId: sendBody.conversationId,
      messageId: sendBody.message._id,
      text: 'Courier cannot rewrite this',
    });
    expect(unauthorizedEditResponse.status).toBe(404);

    const deleteResponse = await patchMessage({
      action: 'delete-message',
      conversationId: sendBody.conversationId,
      messageId: sendBody.message._id,
    });
    expect(deleteResponse.status).toBe(200);

    const courierThreadResponse = await getMessages(
      `http://localhost/api/messages?participantId=${admin._id.toString()}`
    );
    const courierThreadBody = await courierThreadResponse.json();
    expect(courierThreadBody.selectedConversation.messages).toHaveLength(0);

    setSession(admin);
    const adminThreadResponse = await getMessages(
      `http://localhost/api/messages?participantId=${courier._id.toString()}`
    );
    const adminThreadBody = await adminThreadResponse.json();
    expect(adminThreadBody.selectedConversation.messages).toHaveLength(1);
    expect(adminThreadBody.selectedConversation.messages[0].body).toBe('Updated dispatch note');
  });
});
