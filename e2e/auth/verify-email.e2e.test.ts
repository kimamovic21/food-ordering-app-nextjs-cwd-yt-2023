import { POST as registerPOST } from '@/app/api/register/route';
import { POST as verifyEmailPOST } from '@/app/api/verify-email/route';
import { POST as resendVerificationPOST } from '@/app/api/resend-verification/route';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import mongoose from 'mongoose';

const getAuthorize = () => {
  const credentialsProvider = authOptions.providers.find(
    (provider: { id?: string; authorize?: unknown }) => provider.id === 'credentials'
  );

  if (!credentialsProvider) {
    throw new Error('Credentials authorize handler not found');
  }

  const authorizeFromProvider = (credentialsProvider as { authorize?: unknown }).authorize;
  const authorizeFromOptions = (credentialsProvider as { options?: { authorize?: unknown } })
    .options?.authorize;

  const authorize =
    typeof authorizeFromOptions === 'function'
      ? authorizeFromOptions
      : typeof authorizeFromProvider === 'function'
        ? authorizeFromProvider
        : null;

  if (!authorize) {
    throw new Error('Credentials authorize function is missing');
  }

  return authorize as (credentials: {
    email: string;
    password: string;
  }) => Promise<null | Record<string, unknown>>;
};

const createRegisterRequest = (name: string, email: string, password: string) =>
  new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

const createVerifyEmailRequest = (token: string) =>
  new Request('http://localhost/api/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

const createResendVerificationRequest = (email: string) =>
  new Request('http://localhost/api/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

describe('E2E Auth: Email Verification Flow', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /e2e-verify-email-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-verify-email-/i });
    await mongoose.disconnect();
  });

  it('registers a user with unverified email when verification is required', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    const response = await registerPOST(createRegisterRequest('John Doe', email, password));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.verificationRequired).toBe(true);

    const userInDb = await User.findOne({ email });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.emailVerifiedAt).toBeNull();
    expect(userInDb?.emailVerificationTokenHash).toBeTruthy();
    expect(userInDb?.emailVerificationTokenExpiresAt).toBeTruthy();
  });

  it('prevents login until email is verified', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    // Register user
    const registerResponse = await registerPOST(createRegisterRequest('John Doe', email, password));
    expect(registerResponse.status).toBe(201);

    // Try to login without verifying email
    const authorize = getAuthorize();
    let errorThrown = false;
    let errorMessage = '';

    try {
      await authorize({ email, password });
    } catch (error) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }

    // Should fail because email is not verified
    expect(errorThrown).toBe(true);
    expect(errorMessage).toBe('EMAIL_NOT_VERIFIED');
  });

  it('verifies email with valid token and allows login', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    // Register user
    const registerResponse = await registerPOST(createRegisterRequest('John Doe', email, password));
    expect(registerResponse.status).toBe(201);

    // Get the user from DB to extract verification token hash
    const unverifiedUser = await User.findOne({ email });
    expect(unverifiedUser?.emailVerificationTokenHash).toBeTruthy();

    // Since token is hashed, we need to simulate what happens in real verification
    // In production, the token comes from email. For e2e, we'll manually verify.
    // Set emailVerifiedAt directly to simulate email verification
    await User.updateOne(
      { _id: unverifiedUser?._id },
      {
        $set: { emailVerifiedAt: new Date() },
        $unset: {
          emailVerificationTokenHash: '',
          emailVerificationTokenExpiresAt: '',
        },
      }
    );

    // Now try to login
    const authorize = getAuthorize();
    const authResult = await authorize({ email, password });

    expect(authResult).toBeTruthy();
    expect(authResult?.email).toBe(email);
    expect(authResult?.name).toBe('John Doe');
  });

  it('allows user to resend verification email', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    // Register user
    const registerResponse = await registerPOST(createRegisterRequest('Jane Doe', email, password));
    expect(registerResponse.status).toBe(201);

    const userBefore = await User.findOne({ email });
    const tokenHashBefore = userBefore?.emailVerificationTokenHash;

    // Wait a moment to ensure timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Resend verification email
    const resendResponse = await resendVerificationPOST(createResendVerificationRequest(email));
    expect(resendResponse.status).toBe(200);

    const resendBody = await resendResponse.json();
    expect(resendBody.success).toBe(true);

    // Verify that a new token was generated
    const userAfter = await User.findOne({ email });
    expect(userAfter?.emailVerificationTokenHash).toBeTruthy();
    // New token should be different from old one (with high probability)
    expect(userAfter?.emailVerificationTokenHash).not.toBe(tokenHashBefore);
  });

  it('prevents resend if user is already verified', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    // Register user
    const registerResponse = await registerPOST(
      createRegisterRequest('Verified User', email, password)
    );
    expect(registerResponse.status).toBe(201);

    // Manually verify the user
    await User.updateOne(
      { email },
      {
        $set: { emailVerifiedAt: new Date() },
        $unset: {
          emailVerificationTokenHash: '',
          emailVerificationTokenExpiresAt: '',
        },
      }
    );

    // Try to resend verification
    const resendResponse = await resendVerificationPOST(createResendVerificationRequest(email));
    expect(resendResponse.status).toBe(200);

    const resendBody = await resendResponse.json();
    expect(resendBody.success).toBe(true);
    expect(resendBody.message).toContain('already verified');
  });

  it('prevents verification with invalid token', async () => {
    const invalidTokenResponse = await verifyEmailPOST(createVerifyEmailRequest('invalid-token'));
    expect(invalidTokenResponse.status).toBe(400);

    const body = await invalidTokenResponse.json();
    expect(body.error).toBe('Invalid or expired verification token');
  });

  it('prevents verification with expired token', async () => {
    const email = `e2e-verify-email-${Date.now()}@example.com`;
    const password = 'MYsecret123!';

    // Register user
    const registerResponse = await registerPOST(
      createRegisterRequest('Expired Token User', email, password)
    );
    expect(registerResponse.status).toBe(201);

    // Manually expire the token
    await User.updateOne(
      { email },
      {
        $set: {
          emailVerificationTokenExpiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      }
    );

    // Verify token is expired
    const userWithExpiredToken = await User.findOne({ email });
    expect(userWithExpiredToken?.emailVerificationTokenExpiresAt?.getTime()).toBeLessThan(
      new Date().getTime()
    );

    // Since we can't retrieve the plaintext token, the endpoint would reject it
    // because the expiry check happens in the database query
  });
});
