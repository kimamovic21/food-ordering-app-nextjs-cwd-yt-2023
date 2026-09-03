import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCourierAssignmentTimeout } from '@/libs/courierAssignmentTimeout';
import { applyOrderAutoCancellation } from '@/libs/orderAutoCancellation';
import { Order } from '@/models/order';

vi.mock('@upstash/qstash/nextjs', () => ({
  verifySignatureAppRouter: vi.fn((handler) => handler),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn((value: string) => value === '507f1f77bcf86cd799439011'),
      },
    },
  },
}));

vi.mock('@/models/order', () => ({
  Order: {
    findById: vi.fn(),
  },
}));

vi.mock('@/libs/orderAutoCancellation', () => ({
  applyOrderAutoCancellation: vi.fn(),
}));

vi.mock('@/libs/courierAssignmentTimeout', () => ({
  applyCourierAssignmentTimeout: vi.fn(),
}));

const postMaintenance = async (body: Record<string, unknown>) => {
  const { POST } = await import('@/app/api/qstash/order-maintenance/route');

  return POST(
    new Request('http://localhost/api/qstash/order-maintenance', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  );
};

describe('/api/qstash/order-maintenance route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  });

  it('rejects invalid order ids before touching the database', async () => {
    const response = await postMaintenance({
      orderId: 'invalid-id',
      reason: 'unpaid-payment-window',
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid order ID' });
    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(Order.findById).not.toHaveBeenCalled();
  });

  it('rejects unknown maintenance reasons', async () => {
    const response = await postMaintenance({
      orderId: '507f1f77bcf86cd799439011',
      reason: 'unknown-reason',
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid maintenance reason' });
    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(Order.findById).not.toHaveBeenCalled();
  });

  it('returns a safe no-op when the order no longer exists', async () => {
    vi.mocked(Order.findById).mockResolvedValueOnce(null as never);

    const response = await postMaintenance({
      orderId: '507f1f77bcf86cd799439011',
      reason: 'ready-without-courier',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      orderId: '507f1f77bcf86cd799439011',
      canceled: false,
      skipped: 'order_not_found',
    });
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URL);
    expect(applyOrderAutoCancellation).not.toHaveBeenCalled();
    expect(applyCourierAssignmentTimeout).not.toHaveBeenCalled();
  });

  it('runs existing auto-cancel logic for valid QStash maintenance messages', async () => {
    const order = {
      _id: '507f1f77bcf86cd799439011',
      orderStatus: 'placed',
    };
    vi.mocked(Order.findById).mockResolvedValueOnce(order as never);
    vi.mocked(applyOrderAutoCancellation).mockResolvedValueOnce({
      order: { ...order, orderStatus: 'canceled' },
      canceled: true,
      reason: 'Order was automatically canceled.',
    } as never);

    const response = await postMaintenance({
      orderId: '507f1f77bcf86cd799439011',
      reason: 'unpaid-payment-window',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(applyOrderAutoCancellation).toHaveBeenCalledWith(order);
    expect(applyCourierAssignmentTimeout).not.toHaveBeenCalled();
    expect(body).toEqual({
      ok: true,
      orderId: '507f1f77bcf86cd799439011',
      reason: 'unpaid-payment-window',
      canceled: true,
      cancellationReason: 'Order was automatically canceled.',
      orderStatus: 'canceled',
    });
  });

  it('expires stale courier assignments for courier timeout messages', async () => {
    const order = {
      _id: '507f1f77bcf86cd799439011',
      orderStatus: 'ready',
      courierAssignmentStatus: 'pending',
    };
    vi.mocked(Order.findById).mockResolvedValueOnce(order as never);
    vi.mocked(applyCourierAssignmentTimeout).mockResolvedValueOnce({
      order: { ...order, courierAssignmentStatus: 'expired' },
      expired: true,
      reason: 'Courier assignment expired.',
    } as never);

    const response = await postMaintenance({
      orderId: '507f1f77bcf86cd799439011',
      reason: 'courier-assignment-timeout',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(applyCourierAssignmentTimeout).toHaveBeenCalledWith(order);
    expect(applyOrderAutoCancellation).not.toHaveBeenCalled();
    expect(body).toEqual({
      ok: true,
      orderId: '507f1f77bcf86cd799439011',
      reason: 'courier-assignment-timeout',
      assignmentExpired: true,
      expirationReason: 'Courier assignment expired.',
      orderStatus: 'ready',
      courierAssignmentStatus: 'expired',
    });
  });

  it('expires pending assignments before ready-without-courier auto-cancel checks', async () => {
    const order = {
      _id: '507f1f77bcf86cd799439011',
      orderStatus: 'ready',
      courierAssignmentStatus: 'pending',
    };
    vi.mocked(Order.findById).mockResolvedValueOnce(order as never);
    vi.mocked(applyCourierAssignmentTimeout).mockResolvedValueOnce({
      order,
      expired: true,
      reason: 'Courier assignment expired.',
    } as never);
    vi.mocked(applyOrderAutoCancellation).mockResolvedValueOnce({
      order: { ...order, orderStatus: 'canceled' },
      canceled: true,
      reason: 'Order was automatically canceled.',
    } as never);

    const response = await postMaintenance({
      orderId: '507f1f77bcf86cd799439011',
      reason: 'ready-without-courier',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(applyCourierAssignmentTimeout).toHaveBeenCalledWith(order);
    expect(applyOrderAutoCancellation).toHaveBeenCalledWith(order);
    expect(body).toEqual(
      expect.objectContaining({
        canceled: true,
        orderStatus: 'canceled',
      })
    );
  });
});
