import { getServerSession } from 'next-auth/next';

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

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('pdf-buffer')),
  })),
}));

vi.mock('@/components/shared/PurchaseReceiptPdfDocument', () => ({
  default: vi.fn(() => null),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/restaurant', () => ({
  Restaurant: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/menuItem', () => ({
  MenuItem: {
    find: vi.fn(),
  },
}));

const loadRoute = async () => await import('@/app/api/my-orders/invoice/route');

describe('/api/my-orders/invoice route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('returns 401 without session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/my-orders/invoice?sessionId=cs_test_123'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns pdf response for a valid order', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'customer@example.com' } } as never);
    vi.mocked((await import('@/models/user')).User.findOne).mockResolvedValueOnce({ _id: 'user-1', email: 'customer@example.com' } as never);
    vi.mocked((await import('@/models/order')).Order.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({ _id: 'order-1', userId: 'user-1', stripeSessionId: 'cs_test_123', email: 'customer@example.com', restaurantId: 'rest-1', cartProducts: [], updatedAt: new Date(), createdAt: new Date(), taxAmount: 0, deliveryFee: 0, total: 0 }),
    } as never);
    vi.mocked((await import('@/models/restaurant')).Restaurant.findById).mockReturnValueOnce({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ name: 'Rest', contact: '', email: '', street: '', city: '', postalCode: '', country: '' }) }) } as never);
    vi.mocked((await import('@/models/menuItem')).MenuItem.find).mockReturnValueOnce({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) } as never);

    const { GET } = await loadRoute();
    const res = await GET(new Request('http://localhost/api/my-orders/invoice?sessionId=cs_test_123'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });
});
