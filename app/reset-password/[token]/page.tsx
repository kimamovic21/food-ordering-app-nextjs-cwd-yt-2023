import Title from '@/components/shared/Title';
import ResetPasswordForm from './ResetPasswordForm';

type ResetPasswordPageProps = {
  params: { token: string } | Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <section className='mt-8 w-full sm:w-xl md:w-2xl max-w-2xl mx-auto px-4 space-y-6'>
      <div className='text-center mb-4'>
        <Title className='text-4xl'>Reset password</Title>
      </div>

      <div className='space-y-4 rounded-2xl border border-border bg-card p-6'>
        <p className='text-sm text-muted-foreground'>
          Choose a new password for your credentials account.
        </p>
        <ResetPasswordForm token={token} />
      </div>
    </section>
  );
}
