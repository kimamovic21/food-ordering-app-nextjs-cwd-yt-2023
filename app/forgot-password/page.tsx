import Title from '@/components/shared/Title';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4 space-y-6'>
      <div className='text-center mb-4'>
        <Title className='text-4xl'>Forgot password</Title>
      </div>

      <div className='space-y-4 rounded-2xl border border-border bg-card p-6'>
        <p className='text-sm text-muted-foreground'>
          Enter your credentials account email and we will send a reset link if the account uses a
          password.
        </p>
        <p className='text-sm text-muted-foreground'>
          If you used Google sign-in, you cannot reset a password. Use Google to sign in instead.
        </p>

        <ForgotPasswordForm />
      </div>
    </section>
  );
}
