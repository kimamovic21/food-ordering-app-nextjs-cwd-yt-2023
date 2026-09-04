import 'server-only';
import Stripe from 'stripe';

export type StripeCheckoutExpirationReason =
  | 'missing_session_id'
  | 'stripe_not_configured'
  | 'already_paid'
  | 'not_open'
  | 'not_found'
  | 'not_expirable'
  | 'expired'
  | 'stripe_error';

export type StripeCheckoutExpirationResult = {
  attempted: boolean;
  expired: boolean;
  skipped: boolean;
  reason: StripeCheckoutExpirationReason;
  sessionId: string | null;
};

const getStripeClient = () => {
  const stripeSecretKey = process.env.STRIPE_SK?.trim();

  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' });
};

const getStripeErrorDetails = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return {
      code: '',
      message: '',
      statusCode: 0,
    };
  }

  const details = error as {
    code?: unknown;
    message?: unknown;
    statusCode?: unknown;
  };

  return {
    code: typeof details.code === 'string' ? details.code : '',
    message: typeof details.message === 'string' ? details.message : '',
    statusCode: typeof details.statusCode === 'number' ? details.statusCode : 0,
  };
};

const isMissingStripeResourceError = (error: unknown) => {
  const { code, statusCode } = getStripeErrorDetails(error);

  return code === 'resource_missing' || statusCode === 404;
};

const isNotExpirableStripeSessionError = (error: unknown) => {
  const { code, message } = getStripeErrorDetails(error);
  const normalizedMessage = message.toLowerCase();

  return (
    code === 'checkout_session_not_expirable' ||
    normalizedMessage.includes('not expire') ||
    normalizedMessage.includes('cannot be expired') ||
    normalizedMessage.includes('already expired')
  );
};

export const expireOpenStripeCheckoutSession = async (
  stripeSessionId: unknown
): Promise<StripeCheckoutExpirationResult> => {
  const sessionId = typeof stripeSessionId === 'string' ? stripeSessionId.trim() : '';

  if (!sessionId) {
    return {
      attempted: false,
      expired: false,
      skipped: true,
      reason: 'missing_session_id',
      sessionId: null,
    };
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return {
      attempted: false,
      expired: false,
      skipped: true,
      reason: 'stripe_not_configured',
      sessionId,
    };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return {
        attempted: true,
        expired: false,
        skipped: true,
        reason: 'already_paid',
        sessionId,
      };
    }

    if (session.status !== 'open') {
      return {
        attempted: true,
        expired: false,
        skipped: true,
        reason: 'not_open',
        sessionId,
      };
    }

    await stripe.checkout.sessions.expire(sessionId);

    return {
      attempted: true,
      expired: true,
      skipped: false,
      reason: 'expired',
      sessionId,
    };
  } catch (error) {
    if (isMissingStripeResourceError(error)) {
      return {
        attempted: true,
        expired: false,
        skipped: true,
        reason: 'not_found',
        sessionId,
      };
    }

    if (isNotExpirableStripeSessionError(error)) {
      return {
        attempted: true,
        expired: false,
        skipped: true,
        reason: 'not_expirable',
        sessionId,
      };
    }

    console.error('Failed to expire Stripe Checkout session:', error);

    return {
      attempted: true,
      expired: false,
      skipped: false,
      reason: 'stripe_error',
      sessionId,
    };
  }
};
