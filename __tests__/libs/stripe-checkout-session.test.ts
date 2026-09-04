const stripeRetrieveSession = vi.hoisted(() => vi.fn());
const stripeExpireSession = vi.hoisted(() => vi.fn());

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        retrieve: stripeRetrieveSession,
        expire: stripeExpireSession,
      },
    };
  },
}));

import { expireOpenStripeCheckoutSession } from '@/libs/stripeCheckoutSession';

describe('expireOpenStripeCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SK = 'sk_test_expire_checkout';
  });

  afterEach(() => {
    delete process.env.STRIPE_SK;
  });

  it('skips when the order does not have a Stripe session id', async () => {
    const result = await expireOpenStripeCheckoutSession('');

    expect(result).toEqual({
      attempted: false,
      expired: false,
      skipped: true,
      reason: 'missing_session_id',
      sessionId: null,
    });
    expect(stripeRetrieveSession).not.toHaveBeenCalled();
    expect(stripeExpireSession).not.toHaveBeenCalled();
  });

  it('skips safely when Stripe is not configured', async () => {
    delete process.env.STRIPE_SK;

    const result = await expireOpenStripeCheckoutSession('cs_test_missing_config');

    expect(result).toEqual({
      attempted: false,
      expired: false,
      skipped: true,
      reason: 'stripe_not_configured',
      sessionId: 'cs_test_missing_config',
    });
    expect(stripeRetrieveSession).not.toHaveBeenCalled();
    expect(stripeExpireSession).not.toHaveBeenCalled();
  });

  it('expires an open unpaid Checkout session', async () => {
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'open',
      payment_status: 'unpaid',
    });
    stripeExpireSession.mockResolvedValueOnce({ id: 'cs_test_open' });

    const result = await expireOpenStripeCheckoutSession('cs_test_open');

    expect(result).toEqual({
      attempted: true,
      expired: true,
      skipped: false,
      reason: 'expired',
      sessionId: 'cs_test_open',
    });
    expect(stripeRetrieveSession).toHaveBeenCalledWith('cs_test_open');
    expect(stripeExpireSession).toHaveBeenCalledWith('cs_test_open');
  });

  it('does not expire a paid Checkout session', async () => {
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'complete',
      payment_status: 'paid',
    });

    const result = await expireOpenStripeCheckoutSession('cs_test_paid');

    expect(result).toEqual({
      attempted: true,
      expired: false,
      skipped: true,
      reason: 'already_paid',
      sessionId: 'cs_test_paid',
    });
    expect(stripeExpireSession).not.toHaveBeenCalled();
  });

  it('does not expire a Checkout session that is already closed', async () => {
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'expired',
      payment_status: 'unpaid',
    });

    const result = await expireOpenStripeCheckoutSession('cs_test_expired');

    expect(result).toEqual({
      attempted: true,
      expired: false,
      skipped: true,
      reason: 'not_open',
      sessionId: 'cs_test_expired',
    });
    expect(stripeExpireSession).not.toHaveBeenCalled();
  });

  it('treats missing Stripe sessions as a safe skip', async () => {
    stripeRetrieveSession.mockRejectedValueOnce(
      Object.assign(new Error('No such checkout session'), {
        code: 'resource_missing',
        statusCode: 404,
      })
    );

    const result = await expireOpenStripeCheckoutSession('cs_test_deleted');

    expect(result).toEqual({
      attempted: true,
      expired: false,
      skipped: true,
      reason: 'not_found',
      sessionId: 'cs_test_deleted',
    });
    expect(stripeExpireSession).not.toHaveBeenCalled();
  });

  it('treats no-longer-expirable Stripe sessions as a safe skip', async () => {
    stripeRetrieveSession.mockResolvedValueOnce({
      status: 'open',
      payment_status: 'unpaid',
    });
    stripeExpireSession.mockRejectedValueOnce(
      Object.assign(new Error('This Checkout Session cannot be expired'), {
        code: 'checkout_session_not_expirable',
      })
    );

    const result = await expireOpenStripeCheckoutSession('cs_test_race');

    expect(result).toEqual({
      attempted: true,
      expired: false,
      skipped: true,
      reason: 'not_expirable',
      sessionId: 'cs_test_race',
    });
  });

  it('returns a Stripe error result without throwing unexpected failures', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stripeRetrieveSession.mockRejectedValueOnce(new Error('Stripe API unavailable'));

    const result = await expireOpenStripeCheckoutSession('cs_test_error');

    expect(result).toEqual({
      attempted: true,
      expired: false,
      skipped: false,
      reason: 'stripe_error',
      sessionId: 'cs_test_error',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to expire Stripe Checkout session:',
      expect.any(Error)
    );
  });
});
