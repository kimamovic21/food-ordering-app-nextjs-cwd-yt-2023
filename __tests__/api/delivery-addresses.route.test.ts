import { getServerSession } from 'next-auth/next';
import { mongoConnect } from '@/libs/mongoConnect';
import { User } from '@/models/user';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/libs/mongoConnect', () => ({
  mongoConnect: vi.fn(),
}));

vi.mock('mongoose', () => {
  class ObjectId {
    value: string;

    constructor(value = 'address-1') {
      this.value = value;
    }

    toString() {
      return this.value;
    }

    static isValid(value: string) {
      return value !== 'bad-id';
    }
  }

  return {
    default: {
      Types: { ObjectId },
    },
    Types: { ObjectId },
  };
});

vi.mock('@/libs/phone', () => ({
  normalizePhoneNumberForStorage: vi.fn((value: string) =>
    value === 'bad-phone' ? null : '+38761111222'
  ),
}));

vi.mock('@/models/user', () => ({
  User: {
    findOne: vi.fn(),
  },
}));

const loadRoute = async () => import('@/app/api/profile/delivery-addresses/route');

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/profile/delivery-addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const validAddress = {
  label: 'Home',
  phone: '+38761111222',
  streetAddress: 'Main Street 1',
  postalCode: '71000',
  city: 'Sarajevo',
  country: 'Bosnia & Herzegovina',
  deliveryLatitude: 43.8563,
  deliveryLongitude: 18.4131,
  isDefault: true,
};

describe('/api/profile/delivery-addresses route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'customer@example.com' },
    } as never);
  });

  it('requires authentication', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never);

    const { GET } = await loadRoute();
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('creates the first saved address as default', async () => {
    const user = {
      deliveryAddresses: [] as any[],
      save: vi.fn(),
    };
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const { POST } = await loadRoute();
    const res = await POST(createRequest(validAddress));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.address).toEqual(
      expect.objectContaining({
        _id: 'address-1',
        label: 'Home',
        phone: '+38761111222',
        isDefault: true,
      })
    );
    expect(user.deliveryAddresses).toHaveLength(1);
    expect(user.save).toHaveBeenCalled();
    expect(mongoConnect).toHaveBeenCalled();
  });

  it('reuses a duplicate saved address before enforcing the saved address limit', async () => {
    const matchingAddress = {
      _id: { toString: () => 'address-existing' },
      ...validAddress,
      label: 'Home saved earlier',
    };
    const user = {
      deliveryAddresses: [
        matchingAddress,
        ...Array.from({ length: 4 }, (_, index) => ({
          _id: { toString: () => `address-${index + 2}` },
          ...validAddress,
          streetAddress: `Other Street ${index + 2}`,
          deliveryLatitude: validAddress.deliveryLatitude + index + 1,
        })),
      ] as any[],
      save: vi.fn(),
    };
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const { POST } = await loadRoute();
    const res = await POST(createRequest({ ...validAddress, label: 'Same address again' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.duplicate).toBe(true);
    expect(body.address).toEqual(
      expect.objectContaining({
        _id: 'address-existing',
        label: 'Home saved earlier',
      })
    );
    expect(user.deliveryAddresses).toHaveLength(5);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('sets a selected address as default', async () => {
    const user = {
      deliveryAddresses: [
        { _id: { toString: () => 'address-1' }, label: 'Home', isDefault: true },
        { _id: { toString: () => 'address-2' }, label: 'Office', isDefault: false },
      ],
      save: vi.fn(),
    };
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const { PATCH } = await loadRoute();
    const res = await PATCH(
      new Request('http://localhost/api/profile/delivery-addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: 'address-2' }),
      })
    );

    expect(res.status).toBe(200);
    expect(user.deliveryAddresses[0].isDefault).toBe(false);
    expect(user.deliveryAddresses[1].isDefault).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });

  it('deletes a saved address and promotes the remaining one to default', async () => {
    const user = {
      deliveryAddresses: [
        { _id: { toString: () => 'address-1' }, label: 'Home', isDefault: true },
        { _id: { toString: () => 'address-2' }, label: 'Office', isDefault: false },
      ],
      save: vi.fn(),
    };
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request('http://localhost/api/profile/delivery-addresses?addressId=address-1', {
        method: 'DELETE',
      })
    );

    expect(res.status).toBe(200);
    expect(user.deliveryAddresses).toHaveLength(1);
    expect(user.deliveryAddresses[0]._id.toString()).toBe('address-2');
    expect(user.deliveryAddresses[0].isDefault).toBe(true);
  });

  it('rejects saving an address without a confirmed location', async () => {
    const user = {
      deliveryAddresses: [],
      save: vi.fn(),
    };
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const { POST } = await loadRoute();
    const res = await POST(
      createRequest({
        ...validAddress,
        deliveryLatitude: null,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('confirm the delivery location');
    expect(user.save).not.toHaveBeenCalled();
  });
});
