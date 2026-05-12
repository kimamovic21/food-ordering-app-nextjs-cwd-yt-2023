import crypto from 'crypto';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import PasswordResetEmail from '@/components/resend/PasswordResetEmail';
import VerifyEmailEmail from '@/components/resend/VerifyEmailEmail';

const DEFAULT_APP_URL = 'http://localhost:3000';

export const isSkipVerifyEmail = () => process.env.SKIP_VERIFY_EMAIL === 'true';

export const getAppUrl = () => {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || DEFAULT_APP_URL;
  return rawUrl.replace(/\/$/, '');
};

export const generateAuthToken = () => crypto.randomBytes(32).toString('hex');

export const hashAuthToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const sendAuthEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return { sent: false, reason: 'missing_api_key' as const };
  }

  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if ((response as any)?.error) {
      console.error('Resend email API returned an error:', (response as any).error);
      return { sent: false, reason: 'send_failed' as const, error: (response as any).error };
    }

    return { sent: true, response };
  } catch (error) {
    console.error('Failed to send auth email:', error);
    return { sent: false, reason: 'send_failed' as const, error };
  }
};

export const sendVerificationEmail = async ({
  name,
  email,
  token,
}: {
  name: string;
  email: string;
  token: string;
}) => {
  const html = await render(
    <VerifyEmailEmail
      name={name}
      email={email}
      verificationUrl={`${getAppUrl()}/verify-email?token=${token}`}
    />
  );

  return sendAuthEmail({
    to: email,
    subject: 'Verify your email address',
    html,
  });
};

export const sendPasswordResetEmail = async ({
  name,
  email,
  token,
}: {
  name: string;
  email: string;
  token: string;
}) => {
  const html = await render(
    <PasswordResetEmail
      name={name}
      email={email}
      resetUrl={`${getAppUrl()}/reset-password/${token}`}
    />
  );

  return sendAuthEmail({
    to: email,
    subject: 'Reset your password',
    html,
  });
};
