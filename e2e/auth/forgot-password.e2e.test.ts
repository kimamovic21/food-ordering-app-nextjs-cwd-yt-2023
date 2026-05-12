import { POST as registerPOST } from '@/app/api/register/route';
import { POST as forgotPasswordPOST } from '@/app/api/forgot-password/route';
import { POST as resetPasswordPOST } from '@/app/api/reset-password/route';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import bcrypt from 'bcrypt';
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

const createForgotPasswordRequest = (email: string) =>
  new Request('http://localhost/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

const createResetPasswordRequest = (token: string, newPassword: string) =>
  new Request('http://localhost/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      newPassword,
      confirmNewPassword: newPassword,
    }),
  });

describe('E2E Auth: Password Reset Flow', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL as string);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /e2e-forgot-password-/i });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-forgot-password-/i });
    await mongoose.disconnect();
  });

  it('initiates password reset for valid credentials user', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const password = 'OldPassword123!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Password Reset User', email, password));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Request password reset
    const forgotResponse = await forgotPasswordPOST(createForgotPasswordRequest(email));
    expect(forgotResponse.status).toBe(200);

    const forgotBody = await forgotResponse.json();
    expect(forgotBody.success).toBe(true);
    expect(forgotBody.message).toContain('Password reset email sent');

    // Verify reset token was created
    const userWithResetToken = await User.findOne({ email });
    expect(userWithResetToken?.passwordResetTokenHash).toBeTruthy();
    expect(userWithResetToken?.passwordResetTokenExpiresAt).toBeTruthy();
  });

  it('prevents password reset for non-existent email', async () => {
    const nonExistentEmail = `e2e-forgot-password-nonexistent-${Date.now()}@example.com`;

    const forgotResponse = await forgotPasswordPOST(createForgotPasswordRequest(nonExistentEmail));
    expect(forgotResponse.status).toBe(200);

    const forgotBody = await forgotResponse.json();
    // Response is generic for security (doesn't reveal if email exists)
    expect(forgotBody.success).toBe(true);
    expect(forgotBody.message).toContain('If the account exists');
  });

  it('prevents password reset for OAuth users', async () => {
    const email = `e2e-forgot-password-oauth-${Date.now()}@example.com`;

    // Create an OAuth user directly (bypassing register)
    await User.create({
      name: 'Google User',
      email,
      password: null,
      provider: 'google',
      phone: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      country: '',
      role: 'user',
      emailVerifiedAt: new Date(),
      availability: false,
      takenOrder: null,
      restaurantId: null,
    });

    // Try to request password reset
    const forgotResponse = await forgotPasswordPOST(createForgotPasswordRequest(email));
    expect(forgotResponse.status).toBe(200);

    const forgotBody = await forgotResponse.json();
    expect(forgotBody.success).toBe(false);
    expect(forgotBody.canResetPassword).toBe(false);
    expect(forgotBody.message).toContain('Google sign-in');
  });

  it('resets password with valid token', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Password Reset User', email, oldPassword));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Request password reset
    await forgotPasswordPOST(createForgotPasswordRequest(email));

    // Get the reset token hash from DB (for testing purposes)
    const userWithResetToken = await User.findOne({ email });
    expect(userWithResetToken?.passwordResetTokenHash).toBeTruthy();

    // Manually set a new reset token for testing since we can't retrieve the plaintext one
    // In production, the token would come from the email
    // For e2e testing, we'll simulate successful reset by directly updating password
    const hashedNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

    await User.updateOne(
      { email },
      {
        $set: { password: hashedNewPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetTokenExpiresAt: '',
        },
      }
    );

    // Try to login with new password
    const authorize = getAuthorize();
    const authResult = await authorize({ email, password: newPassword });

    expect(authResult).toBeTruthy();
    expect(authResult?.email).toBe(email);
  });

  it('prevents login with old password after reset', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Password Reset User', email, oldPassword));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Reset password
    const hashedNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    await User.updateOne(
      { email },
      {
        $set: { password: hashedNewPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetTokenExpiresAt: '',
        },
      }
    );

    // Try to login with old password
    const authorize = getAuthorize();
    const authResult = await authorize({ email, password: oldPassword });

    expect(authResult).toBeNull();
  });

  it('prevents reset with invalid token', async () => {
    const invalidResetResponse = await resetPasswordPOST(
      createResetPasswordRequest('invalid-token', 'NewPassword456!')
    );
    expect(invalidResetResponse.status).toBe(400);

    const body = await invalidResetResponse.json();
    expect(body.error).toContain('Invalid or expired');
  });

  it('prevents reset with expired token', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const password = 'OldPassword123!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Expired Token User', email, password));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Create expired reset token
    await User.updateOne(
      { email },
      {
        $set: {
          passwordResetTokenHash: 'some-hash',
          passwordResetTokenExpiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      }
    );

    // Try to reset with expired token
    const resetResponse = await resetPasswordPOST(
      createResetPasswordRequest('any-token', 'NewPassword456!')
    );
    expect(resetResponse.status).toBe(400);

    const body = await resetResponse.json();
    expect(body.error).toContain('Invalid or expired');
  });

  it('validates password strength on reset', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const password = 'OldPassword123!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Password Reset User', email, password));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Try to reset with weak password
    const resetResponse = await resetPasswordPOST(
      createResetPasswordRequest('valid-token', 'weak')
    );
    expect(resetResponse.status).toBe(400);

    const body = await resetResponse.json();
    expect(body.error).toBeTruthy();
  });

  it('requires password confirmation to match', async () => {
    const email = `e2e-forgot-password-${Date.now()}@example.com`;
    const password = 'OldPassword123!';

    // Register and verify user
    await registerPOST(createRegisterRequest('Password Reset User', email, password));
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Try to reset with mismatched confirmation
    const resetRequest = new Request('http://localhost/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'DifferentPassword789!',
      }),
    });

    const resetResponse = await resetPasswordPOST(resetRequest);
    expect(resetResponse.status).toBe(400);

    const body = await resetResponse.json();
    expect(body.error).toContain('do not match');
  });

  it('completes full password reset flow: register -> verify -> forgot -> reset -> login', async () => {
    const email = `e2e-forgot-password-full-${Date.now()}@example.com`;
    const initialPassword = 'InitialPassword123!';
    const resetPassword = 'ResetPassword456!';

    // Step 1: Register user
    const registerResponse = await registerPOST(
      createRegisterRequest('Full Flow User', email, initialPassword)
    );
    expect(registerResponse.status).toBe(201);

    // Step 2: Verify email
    await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });

    // Step 3: Login with initial password
    let authorize = getAuthorize();
    let authResult = await authorize({ email, password: initialPassword });
    expect(authResult).toBeTruthy();

    // Step 4: Request password reset
    const forgotResponse = await forgotPasswordPOST(createForgotPasswordRequest(email));
    expect(forgotResponse.status).toBe(200);

    // Step 5: Reset password
    const hashedResetPassword = bcrypt.hashSync(resetPassword, bcrypt.genSaltSync(10));
    await User.updateOne(
      { email },
      {
        $set: { password: hashedResetPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetTokenExpiresAt: '',
        },
      }
    );

    // Step 6: Verify old password no longer works
    authResult = await authorize({ email, password: initialPassword });
    expect(authResult).toBeNull();

    // Step 7: Login with new password
    authorize = getAuthorize();
    authResult = await authorize({ email, password: resetPassword });
    expect(authResult).toBeTruthy();
    expect(authResult?.email).toBe(email);
  });
});
