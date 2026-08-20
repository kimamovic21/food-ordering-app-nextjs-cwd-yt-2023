import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return {
      emails: {
        send: sendMock,
      },
    };
  }),
}));

vi.mock('@react-email/render', () => ({
  render: vi.fn().mockResolvedValue('<html>receipt</html>'),
}));

import { sendPurchaseReceiptEmail } from '@/app/api/webhook/sendPurchaseReceiptEmail';

const receiptArgs = {
  orderId: '507f1f77bcf86cd799439011',
  customerEmail: 'customer@example.com',
  purchasedOn: new Date('2026-08-19T12:00:00.000Z'),
  restaurant: {
    name: 'Test Restaurant',
    contact: '000',
    email: 'restaurant@example.com',
    street: 'Test Street 1',
    city: 'Test City',
    postalCode: '00000',
    country: 'Test Country',
  },
  items: [
    {
      name: 'Test Pizza',
      size: 'small',
      quantity: 1,
      price: 10,
    },
  ],
  taxAmount: 1.7,
  deliveryFee: 5,
  total: 16.7,
};

describe('sendPurchaseReceiptEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('SENDER_EMAIL', 'orders@example.com');
    delete process.env.RESEND_RECEIVER_EMAIL;
    sendMock.mockResolvedValue({ data: { id: 'email_123' } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends purchase receipts to the customer email when no test receiver is configured', async () => {
    await sendPurchaseReceiptEmail(receiptArgs);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'orders@example.com',
        to: ['customer@example.com'],
      })
    );
  });

  it('uses RESEND_RECEIVER_EMAIL as an optional local/test receiver override', async () => {
    vi.stubEnv('RESEND_RECEIVER_EMAIL', 'test-receiver@example.com');

    await sendPurchaseReceiptEmail(receiptArgs);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test-receiver@example.com'],
      })
    );
  });
});
