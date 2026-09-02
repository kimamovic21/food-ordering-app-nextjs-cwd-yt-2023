import { beforeEach, describe, expect, it, vi } from 'vitest';

const publishJSON = vi.hoisted(() => vi.fn());
const clientConstructor = vi.hoisted(() => vi.fn());

vi.mock('@upstash/qstash', () => ({
  Client: class {
    constructor(config: unknown) {
      clientConstructor(config);
    }

    publishJSON = publishJSON;
  },
}));

const originalEnv = { ...process.env };

const loadQStash = async () => {
  vi.resetModules();

  return import('@/libs/qstash');
};

describe('qstash helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.QSTASH_TOKEN;
    delete process.env.QSTASH_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
  });

  it('does not publish background jobs when QStash is not configured', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://food-ordering.example.com';
    const { scheduleUnpaidOrderAutoCancellationCheck } = await loadQStash();

    await expect(scheduleUnpaidOrderAutoCancellationCheck('order-1')).resolves.toEqual({
      scheduled: false,
      messageId: null,
    });
    expect(publishJSON).not.toHaveBeenCalled();
  });

  it('skips publishing when the app URL is local and unreachable by QStash', async () => {
    process.env.QSTASH_TOKEN = 'qstash-token';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const { scheduleReadyWithoutCourierAutoCancellationCheck } = await loadQStash();

    await expect(scheduleReadyWithoutCourierAutoCancellationCheck('order-1')).resolves.toEqual({
      scheduled: false,
      messageId: null,
    });
    expect(publishJSON).not.toHaveBeenCalled();
  });

  it('publishes an unpaid order maintenance check to the public app endpoint', async () => {
    process.env.QSTASH_TOKEN = 'qstash-token';
    process.env.QSTASH_URL = 'https://qstash.example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://food-ordering.example.com/';
    publishJSON.mockResolvedValueOnce({ messageId: 'msg_123' });
    const { scheduleUnpaidOrderAutoCancellationCheck } = await loadQStash();

    await expect(scheduleUnpaidOrderAutoCancellationCheck('order-1')).resolves.toEqual({
      scheduled: true,
      messageId: 'msg_123',
    });

    expect(clientConstructor).toHaveBeenCalledWith({
      token: 'qstash-token',
      baseUrl: 'https://qstash.example.com',
    });
    expect(publishJSON).toHaveBeenCalledWith({
      url: 'https://food-ordering.example.com/api/qstash/order-maintenance',
      body: {
        orderId: 'order-1',
        reason: 'unpaid-payment-window',
      },
      delay: 30 * 60,
      retries: 3,
      method: 'POST',
      label: ['order-maintenance', 'unpaid-payment-window'],
    });
  });

  it('fails open when publishing to QStash fails', async () => {
    process.env.QSTASH_TOKEN = 'qstash-token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://food-ordering.example.com';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    publishJSON.mockRejectedValueOnce(new Error('QStash unavailable'));
    const { scheduleReadyWithoutCourierAutoCancellationCheck } = await loadQStash();

    await expect(scheduleReadyWithoutCourierAutoCancellationCheck('order-1')).resolves.toEqual({
      scheduled: false,
      messageId: null,
    });
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to schedule QStash order maintenance check:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });
});
